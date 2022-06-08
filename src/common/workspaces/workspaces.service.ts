import {Injectable} from '@angular/core';
import {Workspace} from './types/workspace';
import {PaginationParams} from '@common/core/types/pagination/pagination-params';
import {PaginatedBackendResponse} from '@common/core/types/pagination/paginated-backend-response';
import {BackendResponse} from '@common/core/types/backend-response';
import {AppHttpClient} from '@common/core/http/app-http-client.service';
import {WorkspaceMember} from './types/workspace-member';
import {WorkspaceInvite} from './types/workspace-invite';
import {filter, tap} from 'rxjs/operators';
import {CurrentUser} from '@common/auth/current-user';
import {BehaviorSubject, Subscription} from 'rxjs';
import {PaginationResponse} from '@common/core/types/pagination/pagination-response';
import {hasKey} from '@common/core/utils/has-key';
import {CookieService} from '../core/services/cookie.service';
import {NotificationService} from '../notifications/notification-list/notification.service';
import {
    WORKSPACE_INVITE_NOTIF_TYPE,
    WorkspaceInviteNotif,
} from './types/workspace-invite-notif';
import {Toast} from '../core/ui/toast.service';
import {BackendErrorResponse} from '../core/types/backend-error-response';
import {DatabaseNotification} from '../notifications/database-notification';
import {HttpErrors} from '../core/http/errors/http-errors.enum';

const PERSONAL_WORKSPACE = {name: 'Default', default: true, id: null};

@Injectable({
    providedIn: 'root'
})
export class WorkspacesService {
    static BASE_URI = 'workspace';
    available$ = new BehaviorSubject<Workspace[]>([PERSONAL_WORKSPACE]);
    activeId$ = new BehaviorSubject<number>(this.getIdFromCookie());
    activeWorkspace$ = new BehaviorSubject<Workspace>(this.getIdFromCookie() ? null : PERSONAL_WORKSPACE);

    constructor(
        private http: AppHttpClient,
        private currentUser: CurrentUser,
        private cookie: CookieService,
        private notifications: NotificationService,
        private toast: Toast,
    ) {}

    currentUserCan(permission: string): boolean {
        const member = this.activeWorkspace$.value?.currentUser;
        return member && (member.is_owner || member.permissions.findIndex(p => p.name === permission) > -1);
    }

    select(workspaceId: number) {
        if (workspaceId !== this.activeId$.value) {
            this.cookie.set(this.cookieName(), workspaceId);
            this.activeId$.next(workspaceId);
        }
        const workspace = this.available$.value.find(w => w.id === this.activeId$.value);
        this.activeWorkspace$.next(workspace || this.available$.value[0]);
    }

    pushAndSelect(workspace: Workspace) {
        this.available$.next([...this.available$.value, workspace]);
        this.select(workspace.id);
    }

    replace(workspace: Workspace) {
        const workspaces = [...this.available$.value];
        const i = workspaces.findIndex(w => w.id === workspace.id);
        if (i) {
            workspaces[i] = workspace;
        }
        this.available$.next(workspaces);
    }

    remove(ids: number[]) {
        const workspaces = [...this.available$.value];
        ids.forEach(id => {
            const i = workspaces.findIndex(w => w.id === id);
            if (i) {
                workspaces.splice(i, 1);
            }
        });
        this.available$.next(workspaces);
        if (ids.includes(this.activeId$.value)) {
            this.select(null);
        }
    }

    indexUserWorkspaces(): BackendResponse<{workspaces: Workspace[]}> {
        return this.http.get<{workspaces: Workspace[]}>(`me/${WorkspacesService.BASE_URI}s`)
            .pipe(tap(response => {
                this.available$.next([...this.available$.value, ...response.workspaces]);
                this.select(this.activeId$.value);
            }));
    }

    get(workspaceId: number): BackendResponse<{workspace: Workspace}> {
        return this.http.get(`${WorkspacesService.BASE_URI}/${workspaceId}`);
    }

    delete(ids: number[]): BackendResponse<unknown> {
        return this.http.delete(`${WorkspacesService.BASE_URI}/${ids}`)
            .pipe(tap(() => {
                this.remove(ids);
            }));
    }

    create(payload: Partial<Workspace>): BackendResponse<{workspace: Workspace}> {
        return this.http.post<{workspace: Workspace}>(`${WorkspacesService.BASE_URI}`, payload)
            .pipe(tap(response => this.pushAndSelect(response.workspace)));
    }

    update(id: number, payload: Partial<Workspace>): BackendResponse<{workspace: Workspace}> {
        return this.http.put<{workspace: Workspace}>(`${WorkspacesService.BASE_URI}/${id}`, payload)
            .pipe(tap(response => this.replace(response.workspace)));
    }

    invitePeople(workspaceId: number, params: {emails: string[], roleId: number}): BackendResponse<{invites: WorkspaceInvite[]}> {
        return this.http.post(`${WorkspacesService.BASE_URI}/${workspaceId}/invite`, params);
    }

    resendInvite(workspaceId: number, inviteId: string): BackendResponse<{invite: WorkspaceInvite}> {
        return this.http.post(`${WorkspacesService.BASE_URI}/${workspaceId}/${inviteId}/resend`);
    }

    deleteMember(workspaceId: number, userId: number): BackendResponse<unknown> {
        return this.http.delete(`${WorkspacesService.BASE_URI}/${workspaceId}/member/${userId}`)
            .pipe(tap(() => {
                if (userId === this.currentUser.get('id')) {
                    this.remove([workspaceId]);
                }
            }));
    }

    deleteInvite(inviteId: string): BackendResponse<void> {
        return this.http.delete(`${WorkspacesService.BASE_URI}/invite/${inviteId}`);
    }

    changeRole(workspaceId: number, member: WorkspaceMember|WorkspaceInvite, roleId: number): BackendResponse<void> {
        const memberId = hasKey('member_id', member) ? member.member_id : member.id;
        return this.http.post(`${WorkspacesService.BASE_URI}/${workspaceId}/${member.model_type}/${memberId}/change-role`, {roleId});
    }

    join(inviteId: string): BackendResponse<{workspace: Workspace}> {
        return this.http.get(`workspace/join/${inviteId}`);
    }

    bindToNotificationClick(): Subscription {
        return this.notifications.clickedOnNotification$
            .pipe(filter(data => data.notification.type === WORKSPACE_INVITE_NOTIF_TYPE))
            .subscribe(data => {
                const inviteId = (data.notification as WorkspaceInviteNotif).data.inviteId;
                if (data.action.action === 'join') {
                    this.join(inviteId).subscribe(response => {
                        this.notifications.delete([data.notification]).subscribe();
                        this.pushAndSelect(response.workspace);
                        this.toast.open('Joined workspace.');
                    }, (err: BackendErrorResponse) => {
                        this.handleWorkspaceInviteClickError(err, data.notification);
                    });
                } else if (data.action.action === 'decline') {
                    this.deleteInvite(inviteId).subscribe(() => {
                        this.notifications.delete([data.notification]).subscribe();
                        this.toast.open('Declined workspace invite.');
                    }, (err: BackendErrorResponse) => {
                        this.handleWorkspaceInviteClickError(err, data.notification);
                    });
                }
            });
    }

    private handleWorkspaceInviteClickError(err: BackendErrorResponse, notif: DatabaseNotification) {
        if (err.status === 404) {
            this.notifications.delete([notif]).subscribe();
            this.toast.open('That invite is no longer valid.');
        } else {
            this.toast.open(HttpErrors.Default);
        }
    }

    getIdFromCookie() {
        let workspaceId = this.cookie.get(this.cookieName());
        workspaceId = typeof workspaceId === 'string' ? parseInt(workspaceId) : workspaceId;
        return isNaN(workspaceId) ? null : workspaceId;
    }

    private cookieName() {
        return `${this.currentUser.get('id')}_activeWorkspace`;
    }
}
