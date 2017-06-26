/**
 * External dependencies
 */
import request from 'superagent';
import { get } from 'lodash';
import { translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import config from 'config';
import {
	LOGIN_REQUEST,
	LOGIN_REQUEST_FAILURE,
	LOGIN_REQUEST_SUCCESS,
	SOCIAL_LOGIN_REQUEST,
	SOCIAL_LOGIN_REQUEST_FAILURE,
	SOCIAL_LOGIN_REQUEST_SUCCESS,
	SOCIAL_CREATE_ACCOUNT_REQUEST,
	SOCIAL_CREATE_ACCOUNT_REQUEST_FAILURE,
	SOCIAL_CREATE_ACCOUNT_REQUEST_SUCCESS,
	TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST,
	TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST_FAILURE,
	TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST_SUCCESS,
	TWO_FACTOR_AUTHENTICATION_PUSH_POLL_START,
	TWO_FACTOR_AUTHENTICATION_PUSH_POLL_STOP,
	TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST,
	TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST_FAILURE,
	TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST_SUCCESS,
	TWO_FACTOR_AUTHENTICATION_UPDATE_NONCE,
} from 'state/action-types';
import {
	getRememberMe,
	getTwoFactorAuthNonce,
	getTwoFactorUserId,
} from 'state/login/selectors';
import wpcom from 'lib/wp';
import i18nUtils from 'lib/i18n-utils';

const errorFields = {
	empty_password: 'password',
	empty_two_step_code: 'twoStepCode',
	empty_username: 'usernameOrEmail',
	incorrect_password: 'password',
	invalid_email: 'usernameOrEmail',
	invalid_two_step_code: 'twoStepCode',
	invalid_username: 'usernameOrEmail',
};

function getLocalizedLoginURL( action ) {
	if ( 'en' === i18nUtils.getLocaleSlug() ) {
		return 'https://wordpress.com/wp-login.php?action=' + action;
	}

	return 'https://' + i18nUtils.getLocaleSlug() + '.wordpress.com/wp-login.php?action=' + action;
}

/**
 * Retrieves the first error message from the specified HTTP error.
 *
 * @param {Object} httpError HTTP error
 * @returns {{code: string?, message: string, field: string}} an error message and the id of the corresponding field, if not global
 */
function getErrorFromHTTPError( httpError ) {
	let message;
	let field = 'global';

	const code = get( httpError, 'response.body.data.errors.code' );
	message = get( httpError, 'response.body.data.errors.message' );

	if ( code ) {
		if ( code in errorFields ) {
			field = errorFields[ code ];
		}
	} else {
		message = get( httpError, 'response.body.data', httpError.message );
	}

	return { code, message, field };
}

/**
 * Attempt to login a user.
 *
 * @param  {String}    usernameOrEmail    Username or email of the user.
 * @param  {String}    password           Password of the user.
 * @param  {Boolean}   rememberMe         Whether to persist the logged in state of the user
 * @param  {String}    redirectTo         Url to redirect the user to upon successful login
 * @return {Function}                     Action thunk to trigger the login process.
 */
export const loginUser = ( usernameOrEmail, password, rememberMe, redirectTo ) => dispatch => {
	dispatch( {
		type: LOGIN_REQUEST,
	} );

	return request.post( getLocalizedLoginURL( 'login-endpoint' ) )
		.withCredentials()
		.set( 'Content-Type', 'application/x-www-form-urlencoded' )
		.accept( 'application/json' )
		.send( {
			username: usernameOrEmail,
			password,
			remember_me: rememberMe,
			redirect_to: redirectTo,
			client_id: config( 'wpcom_signup_id' ),
			client_secret: config( 'wpcom_signup_key' ),
		} ).then( ( response ) => {
			dispatch( {
				type: LOGIN_REQUEST_SUCCESS,
				rememberMe,
				data: response.body && response.body.data,
			} );
		} ).catch( ( httpError ) => {
			const error = getErrorFromHTTPError( httpError );

			dispatch( {
				type: LOGIN_REQUEST_FAILURE,
				error,
			} );

			return Promise.reject( error );
		} );
};

/**
 * Attempt to login a user when a two factor verification code is sent.
 *
 * @param  {String}    twoStepCode  Verification code for the user.
 * @param {String}     twoFactorAuthType Two factor authentication method
 * @return {Function}                 Action thunk to trigger the login process.
 */
export const loginUserWithTwoFactorVerificationCode = ( twoStepCode, twoFactorAuthType ) => ( dispatch, getState ) => {
	dispatch( { type: TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST } );

	return request.post( getLocalizedLoginURL( 'two-step-authentication-endpoint' ) )
		.withCredentials()
		.set( 'Content-Type', 'application/x-www-form-urlencoded' )
		.accept( 'application/json' )
		.send( {
			user_id: getTwoFactorUserId( getState() ),
			auth_type: twoFactorAuthType,
			two_step_code: twoStepCode,
			two_step_nonce: getTwoFactorAuthNonce( getState(), twoFactorAuthType ),
			remember_me: getRememberMe( getState() ),
			client_id: config( 'wpcom_signup_id' ),
			client_secret: config( 'wpcom_signup_key' ),
		} )
		.then( () => {
			dispatch( { type: TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST_SUCCESS } );
		} )
		.catch( ( httpError ) => {
			const error = getErrorFromHTTPError( httpError );

			dispatch( {
				type: TWO_FACTOR_AUTHENTICATION_UPDATE_NONCE,
				twoStepNonce: get( httpError, 'response.body.data.two_step_nonce' ),
				nonceType: twoFactorAuthType,
			} );

			dispatch( {
				type: TWO_FACTOR_AUTHENTICATION_LOGIN_REQUEST_FAILURE,
				error,
			} );

			return Promise.reject( error );
		} );
};

/**
 * Attempt to login a user with an external social account.
 *
 * @param  {String}    service    The external social service name.
 * @param  {String}    token      Authentication token provided by the external social service.
 * @param  {String}    redirectTo Url to redirect the user to upon successful login
 * @return {Function}             Action thunk to trigger the login process.
 */
export const loginSocialUser = ( service, token, redirectTo ) => dispatch => {
	dispatch( { type: SOCIAL_LOGIN_REQUEST } );

	return request.post( getLocalizedLoginURL( 'social-login-endpoint' ) )
		.withCredentials()
		.set( 'Content-Type', 'application/x-www-form-urlencoded' )
		.accept( 'application/json' )
		.send( {
			service,
			token,
			redirect_to: redirectTo,
			client_id: config( 'wpcom_signup_id' ),
			client_secret: config( 'wpcom_signup_key' ),
		} )
		.then( ( response ) => {
			dispatch( {
				type: SOCIAL_LOGIN_REQUEST_SUCCESS,
				redirectTo: get( response, 'body.data.redirect_to' ),
			} );
		} )
		.catch( ( httpError ) => {
			const error = getErrorFromHTTPError( httpError );

			dispatch( {
				type: SOCIAL_LOGIN_REQUEST_FAILURE,
				error,
			} );

			return Promise.reject( error );
		} );
};

/**
 * Attempt to create an account with a social service
 usersSocialNew( 'google', response.Zi.id_token, 'login', ( wpcomError, wpcomResponse ) => {
 *
 * @param  {String}    service    The external social service name.
 * @param  {String}    token      Authentication token provided by the external social service.
 * @param  {String}    flowName   the name of the signup flow
 * @return {Function}             Action thunk to trigger the login process.
 */
export const createSocialUser = ( service, token, flowName ) => dispatch => {
	dispatch( {
		type: SOCIAL_CREATE_ACCOUNT_REQUEST,
		notice: {
			message: translate( 'Creating your account' )
		},
	} );

	return wpcom.undocumented().usersSocialNew( service, token, flowName ).then( wpcomResponse => {
		dispatch( { type: SOCIAL_CREATE_ACCOUNT_REQUEST_SUCCESS } );
		return Promise.resolve( wpcomResponse );
	} ).catch( wpcomError => {
		const error = { ...wpcomError, field: 'global' };

		dispatch( {
			type: SOCIAL_CREATE_ACCOUNT_REQUEST_FAILURE,
			error,
		} );

		return Promise.reject( wpcomError );
	} );
};

/**
 * Sends a two factor authentication recovery code to the 2FA user
 *
 * @return {Function}                Action thunk to trigger the request.
 */
export const sendSmsCode = () => ( dispatch, getState ) => {
	dispatch( {
		type: TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST,
		notice: {
			message: translate( 'Sending you a text message…' )
		},
	} );

	return request.post( getLocalizedLoginURL( 'send-sms-code-endpoint' ) )
		.set( 'Content-Type', 'application/x-www-form-urlencoded' )
		.accept( 'application/json' )
		.send( {
			user_id: getTwoFactorUserId( getState() ),
			two_step_nonce: getTwoFactorAuthNonce( getState(), 'sms' ),
			client_id: config( 'wpcom_signup_id' ),
			client_secret: config( 'wpcom_signup_key' ),
		} )
		.then( ( response ) => {
			const phoneNumber = get( response, 'body.data.phone_number' );
			const message = translate( 'Message sent to phone number ending in %(phoneNumber)s', {
				args: {
					phoneNumber
				}
			} );

			dispatch( {
				type: TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST_SUCCESS,
				notice: {
					message,
					status: 'is-success'
				},
				twoStepNonce: get( response, 'body.data.two_step_nonce' ),
			} );
		} ).catch( ( httpError ) => {
			const error = getErrorFromHTTPError( httpError );

			dispatch( {
				type: TWO_FACTOR_AUTHENTICATION_SEND_SMS_CODE_REQUEST_FAILURE,
				error,
				twoStepNonce: get( httpError, 'response.body.data.two_step_nonce' )
			} );
		} );
};

export const startPollAppPushAuth = () => ( { type: TWO_FACTOR_AUTHENTICATION_PUSH_POLL_START } );
export const stopPollAppPushAuth = () => ( { type: TWO_FACTOR_AUTHENTICATION_PUSH_POLL_STOP } );
