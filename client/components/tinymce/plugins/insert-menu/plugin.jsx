/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { renderToString } from 'react-dom/server';
import i18n from 'i18n-calypso';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import tinymce from 'tinymce/tinymce';
import { getSelectedSiteId } from 'state/ui/selectors';
import { isEnabled } from 'config';
import { FEATURE_SIMPLE_PAYMENTS } from 'lib/plans/constants';
import { hasFeature } from 'state/sites/plans/selectors';

/* eslint-disable wpcalypso/jsx-classname-namespace */
const GridiconButton = ( { icon, label } ) => (
	<div>
		<Gridicon className="wpcom-insert-menu__menu-icon" icon={ icon } />
		<span className="wpcom-insert-menu__menu-label">{ label }</span>
	</div>
);
/* eslint-enable wpcalypso/jsx-classname-namespace */

const initialize = editor => {
	const menuItems = [ {
		name: 'insert_media_item',
		item: <GridiconButton icon="add-image" label={ i18n.translate( 'Add Media' ) } />,
		cmd: 'wpcomAddMedia'
	} ];

	if ( isEnabled( 'external-media' ) ) {
		menuItems.push( {
			name: 'insert_from_google',
			item: <GridiconButton icon="add-image" label={ i18n.translate( 'Add from Google' ) } />,
			cmd: 'googleAddMedia'
		} );
	}

	menuItems.push( {
		name: 'insert_contact_form',
		item: <GridiconButton icon="mention" label={ i18n.translate( 'Add Contact Form' ) } />,
		cmd: 'wpcomContactForm'
	} );

	// This needs to be called inside `initialize` each time an Editor is initialized because
	// Simple Payments might not be enabled for all types of subscriptions.
	if ( isEnabled( 'simple-payments' ) ) {
		const store = editor.getParam( 'redux_store' );

		if ( store ) {
			const state = store.getState();

			const siteId = getSelectedSiteId( state );

			if ( hasFeature( state, siteId, FEATURE_SIMPLE_PAYMENTS ) ) {
				menuItems.push( {
					name: 'insert_payment_button',
					item: <GridiconButton icon="money" label={ i18n.translate( 'Add Payment Button' ) } />,
					cmd: 'simplePaymentsButton'
				} );
			}
		}
	}

	menuItems.forEach( item =>
		editor.addMenuItem( item.name, {
			classes: 'wpcom-insert-menu__menu-item',
			cmd: item.cmd,
			onPostRender() {
				this.innerHtml( renderToString( item.item ) );
			}
		} )
	);

	editor.addButton( 'wpcom_insert_menu', {
		type: 'splitbutton',
		title: i18n.translate( 'Insert content' ),
		classes: 'btn wpcom-insert-menu insert-menu',
		cmd: menuItems[ 0 ].cmd,
		menu: menuItems.map( ( { name } ) => editor.menuItems[ name ] ),
		onPostRender() {
			ReactDOM.render(
				<Gridicon icon="add-outline" />,
				this.$el[ 0 ].children[ 0 ]
			);
		}
	} );
};

export default () => {
	tinymce.PluginManager.add( 'wpcom/insertmenu', initialize );
};
