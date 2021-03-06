import {ChangeDetectorRef, Directive, OnDestroy} from '@angular/core';
import {SettingsState} from './settings-state.service';
import {ActivatedRoute, Router} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {Settings} from '../../core/config/settings.service';
import {Toast} from '../../core/ui/toast.service';
import {Modal} from '../../core/ui/dialogs/modal.service';
import {CustomHomepage} from '../../pages/shared/custom-homepage.service';
import {AppHttpClient} from '../../core/http/app-http-client.service';
import {SettingsPayload} from '../../core/config/settings-payload';
import {BehaviorSubject} from 'rxjs';
import {ValueLists} from '@common/core/services/value-lists.service';
import {scrollInvalidInputIntoView} from '@common/core/utils/scroll-invalid-input-into-view';
import {BackendErrorResponse} from '@common/core/types/backend-error-response';
import {SocialAuthService} from '../../auth/social-auth.service';

@Directive()
export abstract class SettingsPanelComponent implements OnDestroy {
    constructor(
        public settings: Settings,
        protected toast: Toast,
        protected http: AppHttpClient,
        protected modal: Modal,
        protected route: ActivatedRoute,
        protected customHomepage: CustomHomepage,
        protected valueLists: ValueLists,
        protected cd: ChangeDetectorRef,
        protected router: Router,
        protected social: SocialAuthService,
        public state: SettingsState,
    ) {}

    ngOnDestroy() {
        this.state.reset();
    }

    public setJson(name: string, value: string[]|number[]) {
        this.state.client[name] = JSON.stringify(value);
    }

    public getJson(name: string): any[] {
        const value = this.state.client[name];
        if ( ! value) return [];
        return JSON.parse(value as string);
    }

    public saveSettings(settings?: SettingsPayload) {
        this.state.loading$.next(true);
        const changedSettings = settings || this.state.getModified();
        this.settings.save(changedSettings)
            .pipe(finalize(() => this.state.loading$.next(false)))
            .subscribe(() => {
                this.toast.open('Settings saved.');
                this.clearErrors();
                // update initial settings after saving, so
                // so new setting state is not lost when
                // navigating between setting panels
                this.state.updateInitial(changedSettings);
            }, (errResponse: BackendErrorResponse) => {
                this.state.errors$.next(errResponse.errors);
                scrollInvalidInputIntoView(this.state.errors$.value);
            });
    }

    public clearErrors() {
        this.state.errors$.next({});
    }
}
