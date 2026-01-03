import { AbstractAssemblage, Assemblage, Use } from 'assemblerjs';
import { Await, flatten, setValueAtPath } from '@assemblerjs/core';
import { is } from '@electron-toolkit/utils';
import { FsService } from '@/features/fs/main';
import { PreferencesIpcChannel } from '@/preload/channels';
import { IpcHandle, IpcListener, ToIpcResult } from '@assemblerjs/electron';
import { AbstractSchoolService } from '@/features/school/main/services/school.abstract';
import {
  AppPreferencesService,
  BarcodePreferencesService,
  BooksApiPreferencesService,
  LoansPreferencesService,
  SchoolPreferencesService,
} from './services';
import { SettingsConfiguration } from '../universal/types';
import { Body } from '@/features/database/universal';
import { SetPreferencesDto } from '../universal/api-dto';
import { IsValidDto } from '@/features/entities/universal';
import { NotFoundError } from '@/features/error-handler/universal';

@Assemblage({
  inject: [
    [AppPreferencesService],
    [BarcodePreferencesService],
    [BooksApiPreferencesService],
    [LoansPreferencesService],
    [SchoolPreferencesService],
  ],
})
@IpcListener()
export class PreferencesModule implements AbstractAssemblage {
  public ready = false;
  public preferences: SettingsConfiguration | null = null;

  constructor(
    @Use('env') private env: MainEnv,
    @Use('preferences') private defaultPreferences: any,
    public fsService: FsService,
    public schoolService: AbstractSchoolService,
    public appPreferences: AppPreferencesService,
    public barcodePreferences: BarcodePreferencesService,
    public booksApiPreferences: BooksApiPreferencesService,
    public loansPreferences: LoansPreferencesService,
    public schoolPreferences: SchoolPreferencesService,
  ) {}

  public async onInit(): Promise<void> {
    // Read existing preferences file if it exists, otherwise write defaults
    const preferencesFile = `${this.env.dataPath}/${this.defaultPreferences.filename}`;

    const file = await this.fsService.readFile(preferencesFile);
    if (!file) {
      delete this.defaultPreferences.filename;
      this.preferences = this.defaultPreferences;
      await this.savePreferences();
    } else {
      try {
        this.preferences = JSON.parse(file);
      } catch (_error) {
        // Nothing to do here.
      }
    }
    await this.checkZonesAndAcademies();
    this.ready = true;
  }

  public async savePreferences(): Promise<void> {
    if (!this.preferences) return;
    const preferencesFile = `${this.env.dataPath}/${this.defaultPreferences.filename}`;
    await this.fsService.safeWriteFile(
      preferencesFile,
      JSON.stringify(this.preferences, null, is.dev ? 2 : 0),
      { overwrite: true },
    );
  }

  private async checkZonesAndAcademies(): Promise<void> {
    if (!this.preferences) return;

    const zones = this.preferences.school.zones;
    if (!zones || zones.length === 0) {
      const zonesOrError = await this.schoolService.downloadZones();
      if (zonesOrError instanceof Error) {
        throw zonesOrError;
      }
      this.preferences.school.zones = zonesOrError;
      await this.savePreferences();
    }

    const academies = this.preferences.school.academies;
    if (!academies || academies.length === 0) {
      const academiesOrError = await this.schoolService.downloadAcademies();
      if (academiesOrError instanceof Error) {
        throw academiesOrError;
      }
      this.preferences.school.academies = academiesOrError;
      await this.savePreferences();
    }
  }

  @ToIpcResult<SettingsConfiguration | null>()
  @IpcHandle(PreferencesIpcChannel.GetPreferences)
  public getPreferences(): SettingsConfiguration | null {
    return this.preferences;
  }

  @ToIpcResult<SettingsConfiguration | null>()
  @IsValidDto()
  @IpcHandle(PreferencesIpcChannel.SetPreferences)
  public async setPreferences(
    @Body() preferences: SetPreferencesDto,
  ): Promise<SettingsConfiguration | Error | null> {
    try {
      if (!this.preferences) {
        return new Error('Preferences not loaded');
      }

      for (const setting of preferences.settings) {
        const flat = flatten(this.preferences);
        const existing = flat[setting.key];

        if (existing === undefined) {
          return new NotFoundError(`Setting ${setting.key} does not exist`);
        }

        const key = setting.key;
        const value = setting.value;
        this.preferences = setValueAtPath(key)(
          this.preferences as any,
          value,
        ) as SettingsConfiguration;
      }

      await this.savePreferences();
      return this.preferences;
    } catch (error) {
      return error as Error;
    }
  }

  @Await('ready')
  public async whenReady(): Promise<void> {
    return;
  }
}
