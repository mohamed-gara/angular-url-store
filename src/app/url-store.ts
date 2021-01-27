import {Inject, Injectable, InjectionToken} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Params, Router} from '@angular/router';
import {merge, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';

export interface ParamsConverter<T> {
  fromUrl(Params): T;

  toUrl(T): Params;
}

export const URL_STORE_CONVERTER = new InjectionToken<ParamsConverter<any>>('ParamsConverter');

/**
 * UrlStore should be used when we need to synchronize the state of the application with the URL Query Params.
 */
@Injectable()
export class UrlStore<T> {
  changed: Observable<T>;
  refreshed = new Subject<T>();
  changedOrRefreshed: Observable<T>;

  constructor(
    @Inject(URL_STORE_CONVERTER) private converter: ParamsConverter<T>,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.changed = this.route.queryParams.pipe(map(converter.fromUrl));
    this.changedOrRefreshed = merge(this.changed, this.refreshed);
  }

  set(params: T) {
    const extras = {
      relativeTo: this.route,
      queryParams: this.converter.toUrl(params),
    } as NavigationExtras;

    this.router.navigate(['.'], extras).then(result => {
      const urlIsTheSame = result === null;
      if (urlIsTheSame) {
        this.refreshed.next(params);
      }
    });
  }
}
