import {Location} from '@angular/common';
import {fakeAsync, tick, TestBed, waitForAsync} from '@angular/core/testing';
import {Params, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {
  URL_STORE_CONVERTER,
  ParamsConverter,
  UrlStore,
} from './url-store';
import {NgZone} from '@angular/core';

describe('UrlStore', () => {
  let sut: UrlStore<PageNumber>;

  let lastEmittedChange;
  let lastEmittedChangeOrRefresh;
  let lastEmittedRefresh;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        UrlStore,
        {provide: URL_STORE_CONVERTER, useClass: PageParamsConverter},
      ]
    });
  }));

  beforeEach(waitForAsync(() => {
    lastEmittedChange = [];
    lastEmittedChangeOrRefresh = [];
    lastEmittedRefresh = [];

    TestBed.inject(NgZone)
      .run(() => TestBed.inject(Router).initialNavigation());

    sut = TestBed.inject<UrlStore<PageNumber>>(UrlStore);

    sut.changed.subscribe(value => lastEmittedChange.push(value));
    sut.changedOrRefreshed.subscribe(value => lastEmittedChangeOrRefresh.push(value));
    sut.refreshed.subscribe(value => lastEmittedRefresh.push(value));
  }));

  it('should emit on change and changeOrRefresh observables when url is changed', fakeAsync(() => {
    TestBed.inject(NgZone).run(() => TestBed.inject(Location).go('/', 'page=1'));
    tick();

    expect(lastEmittedChange).toEqual([{page: 1}]);
    expect(lastEmittedChangeOrRefresh).toEqual([{page: 1}]);
    expect(lastEmittedRefresh).toEqual([]);
  }));

  it('should emit on change and changeOrRefresh observables when url is changed', fakeAsync(() => {
    TestBed.inject(NgZone).run(() => TestBed.inject(Router).navigate(['/'], {queryParams: {page: 2}}));
    tick();

    expect(lastEmittedChange).toEqual([{page: 2}]);
    expect(lastEmittedChangeOrRefresh).toEqual([{page: 2}]);
    expect(lastEmittedRefresh).toEqual([]);
  }));

  it('should emit on change and changeOrRefresh observables when set() is invoked with new params', fakeAsync(() => {
    TestBed.inject(NgZone).run(() => sut.set({page: 3}));
    tick();

    expect(lastEmittedChange).toEqual([{page: 3}]);
    expect(lastEmittedChangeOrRefresh).toEqual([{page: 3}]);
    expect(lastEmittedRefresh).toEqual([]);
  }));

  it('should update the url when set() is invoked with new params', fakeAsync(() => {
    TestBed.inject(NgZone).run(() => sut.set({page: 4}));
    tick();

    expect(TestBed.inject(Location).path()).toEqual('/?page=4');
  }));

  it('should emit on refresh and changeOrRefresh observables when set() is invoked with the current params', fakeAsync(() => {
    TestBed.inject(NgZone).run(() => TestBed.inject(Location).go('/', 'page=5'));
    tick();

    lastEmittedChange = [];
    lastEmittedChangeOrRefresh = [];
    lastEmittedRefresh = [];
    TestBed.inject(NgZone).run(() => sut.set({page: 5}));
    tick();

    expect(lastEmittedChange).toEqual([]);
    expect(lastEmittedChangeOrRefresh).toEqual([{page: 5}]);
    expect(lastEmittedRefresh).toEqual([{page: 5}]);
  }));
});

interface PageNumber {
  page: number;
}

export class PageParamsConverter implements ParamsConverter<PageNumber> {
  fromUrl(params: Params): PageNumber {
    return {page: Number(params.page)};
  }

  toUrl(model: PageNumber): Params {
    return {...model};
  }
}
