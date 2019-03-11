import { Injectable } from '@angular/core'
import { Http, Headers, Response } from '@angular/http'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/operator/map'

import { CompareData } from './compare-data.model'
import { AuthService } from '../user/auth.service'
import { query } from '@angular/core/src/animation/dsl'

@Injectable()
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false)
  dataIsLoading = new BehaviorSubject<boolean>(false)
  dataLoaded = new Subject<CompareData[]>()
  dataLoadFailed = new Subject<boolean>()
  userData: CompareData
  constructor(private http: Http, private authService: AuthService) {}

  onStoreData(data: CompareData) {
    this.dataLoadFailed.next(false)
    this.dataIsLoading.next(true)
    this.dataEdited.next(false)
    this.userData = data
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.error(err)
        return
      }
      console.info('sending data', JSON.stringify(data))
      // console.info('session: ', JSON.stringify(session))
      // console.info('idToken', JSON.stringify(session.getIdToken()))
      console.info('token:  ', session.getIdToken().getJwtToken())
      console.info('---')

      this.http
        .post('https://67z21vv7ph.execute-api.us-east-2.amazonaws.com/dev/-compare-yourself', data, {
          headers: new Headers({ Authorization: session.getIdToken().getJwtToken() }),
        })
        .subscribe(
          result => {
            console.info('post result: ', result)
            this.dataLoadFailed.next(false)
            this.dataIsLoading.next(false)
            this.dataEdited.next(true)
          },
          error => {
            console.info('post error ', error)
            this.dataIsLoading.next(false)
            this.dataLoadFailed.next(true)
            this.dataEdited.next(false)
          }
        )
    })
  }
  onRetrieveData(all = true) {
    this.dataLoaded.next(null)
    this.dataLoadFailed.next(false)

    let urlParam = 'all'
    if (!all) {
      urlParam = 'single'
    }

    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.error(err)
        return
      }
      const queryParam = '?accessToken=' + session.getAccessToken().getJwtToken()

      this.http
        .get('https://67z21vv7ph.execute-api.us-east-2.amazonaws.com/dev/-compare-yourself/' + urlParam + queryParam, {
          headers: new Headers({ Authorization: session.getIdToken().getJwtToken() }),
        })
        .map((response: Response) => response.json())
        .subscribe(
          data => {
            if (all) {
              this.dataLoaded.next(data)
            } else {
              console.log(data)
              if (!data) {
                this.dataLoadFailed.next(true)
                return
              }
              this.userData = data[0]
              this.dataEdited.next(true)
            }
          },
          error => {
            this.dataLoadFailed.next(true)
            this.dataLoaded.next(null)
          }
        )
    })
  }
  onDeleteData() {
    this.dataLoadFailed.next(false)

    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.error(err)
        return
      }
      const queryParam = '?accessToken=' + session.getAccessToken().getJwtToken()

      this.http
        .delete('https://67z21vv7ph.execute-api.us-east-2.amazonaws.com/dev/-compare-yourself/' + queryParam, {
          headers: new Headers({ Authorization: session.getIdToken().getJwtToken() }),
        })
        .subscribe(
          data => {
            console.log(data)
          },
          error => this.dataLoadFailed.next(true)
        )
    })
  }
}
