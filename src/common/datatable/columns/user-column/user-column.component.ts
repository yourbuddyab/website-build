import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {User} from '@common/core/types/models/User';
import {UrlGeneratorService} from '@common/core/services/url-generator.service';

@Component({
    selector: 'user-column',
    templateUrl: './user-column.component.html',
    styleUrls: ['./user-column.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {class: 'column-with-image'},
})
export class UserColumnComponent {
    @Input() user: User;
    @Input() showEmail = false;
    haveUrl: boolean;

    constructor(public url: UrlGeneratorService) {
        this.haveUrl = !!url['user'];
    }
}
