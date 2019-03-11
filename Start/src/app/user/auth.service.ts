import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Subject } from 'rxjs/Subject'

import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { User } from './user.model'
import { CognitoIdentityCredentials } from 'aws-sdk'
import * as AWS from 'aws-sdk/global'

const POOL_DATA = {
  UserPoolId: 'us-east-2_yqjOYqVrE',
  ClientId: '41anhji1co078u85aahof9i9lo',
}

var userPool = new CognitoUserPool(POOL_DATA)

@Injectable()
export class AuthService {
  authIsLoading = new BehaviorSubject<boolean>(false)
  authDidFail = new BehaviorSubject<boolean>(false)
  authStatusChanged = new Subject<boolean>()
  registeredUser: CognitoUser
  authorizedUser: CognitoUser
  constructor(private router: Router) {}
  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true)

    const user: User = {
      username: username,
      email: email,
      password: password,
    }
    const attrList: CognitoUserAttribute[] = []

    const emailAttribute = {
      Name: 'email',
      Value: user.email,
    }
    attrList.push(new CognitoUserAttribute(emailAttribute))
    console.info(user, attrList)
    userPool.signUp(user.username, user.password, attrList, null, (err, result) => {
      if (err) {
        console.error(err)
        this.authDidFail.next(true)
        this.authIsLoading.next(false)
        return
      }
      this.authDidFail.next(false)
      this.authIsLoading.next(false)
      this.registeredUser = result.user
      console.info(`user name is ${this.registeredUser.getUsername()}`)
    })
    return
  }
  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true)
    const userData = {
      Username: username,
      Pool: userPool,
    }
    const cognitoUser = new CognitoUser(userData)
    console.log(`confirming user ${cognitoUser}`)
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      this.authIsLoading.next(false)
      if (err) {
        console.error(err)
        this.authDidFail.next(true)
        return
      }
      console.log('registration Confirmed: ' + result)
      this.authDidFail.next(false)
      this.router.navigate(['/'])
    })
  }
  signIn(username: string, password: string): void {
    this.authIsLoading.next(true)
    const authData = {
      Username: username,
      Password: password,
    }

    this.authStatusChanged.next(true)
    const authenticationDetails = new AuthenticationDetails(authData)
    const userData = {
      Username: username,
      Pool: userPool,
    }
    const cognitoUser = new CognitoUser(userData)
    this.authorizedUser = cognitoUser

    const vm = this
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: CognitoUserSession) => {
        var accessToken = result.getAccessToken().getJwtToken()
        console.log('Logged in!', accessToken)
        vm.authStatusChanged.next(true)
        vm.authDidFail.next(false)
        vm.authIsLoading.next(false)
        console.log(result)
      },
      onFailure: err => {
        console.log(err)
        vm.authDidFail.next(true)
        vm.authIsLoading.next(false)
      },
    })
    return
  }

  getAuthenticatedUser() {
    return userPool.getCurrentUser()
  }
  logout() {
    this.getAuthenticatedUser().signOut()
    this.authStatusChanged.next(false)
  }

  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser()
    const obs = Observable.create(observer => {
      if (!user) {
        observer.next(false)
      } else {
        user.getSession((err, session) => {
          if (err) {
            observer.next(false)
          } else {
            if (session.isValid()) {
              observer.next(true)
            } else {
              observer.next(false)
            }
          }
        })
      }
      observer.complete()
    })
    return obs
  }
  initAuth() {
    this.isAuthenticated().subscribe(auth => this.authStatusChanged.next(auth))
  }
}
