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

import { menuItems, GridiconButton } from './menu-items';

const initialize = editor => {
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
