import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {ReactiveFormsModule} from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import {HomepageAppearancePanelComponent} from './homepage-appearance-panel/homepage-appearance-panel.component';
import {APPEARANCE_EDITOR_CONFIG} from '../../../common/admin/appearance/appearance-editor-config.token';
import {APP_APPEARANCE_CONFIG} from './app-appearance-config';
import {ColorPickerInputModule} from '../../../common/core/ui/color-picker/color-picker-input/color-picker-input.module';
import {TranslationsModule} from '../../../common/core/translations/translations.module';
import {BaseAppearanceModule} from '../../../common/admin/appearance/base-appearance.module';


@NgModule({
    declarations: [
        HomepageAppearancePanelComponent,
    ],
    imports: [
        CommonModule,
        BaseAppearanceModule,
        ReactiveFormsModule,
        ColorPickerInputModule,
        TranslationsModule,

        // material
        MatIconModule,
        MatButtonModule,
        TranslationsModule,
        MatSliderModule,
    ],
    providers: [
        {
            provide: APPEARANCE_EDITOR_CONFIG,
            useValue: APP_APPEARANCE_CONFIG,
            multi: true,
        }
    ]
})
export class AppAppearanceModule {
}
