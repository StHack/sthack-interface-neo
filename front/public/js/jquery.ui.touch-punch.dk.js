/**
 * jQuery UI Touch Punch 0.3.2
 *
 * Copyright 2014, Dzmitry Khadorkin <dzmitry@khadorkin.by>
 * Original jquery-ui-touch-punch Copyright 2011-2014, Dave Furfero
 * Hacked jquery-ui-touch-punch-improved Copyright 2013, Chris Hutchinson
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function (module) {
	if (typeof define === 'function' && define.amd) define(['jquery'], module);// AMD. Register as an anonymous module.
	else module(jQuery);// Browser globals
})(function(jQuery, undefined){
	var pointerEnabled = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
	// Detect touch support
	jQuery.support.touch = 'ontouchend' in document || pointerEnabled;
	// Ignore browsers without touch support or mouse support
	if (!jQuery.support.touch || !jQuery.ui.mouse) return;
	var mouseProto = jQuery.ui.mouse.prototype
		, _mouseInit = mouseProto._mouseInit
		, _mouseDestroy = mouseProto._mouseDestroy
		, touchHandled;
	// see http://stackoverflow.com/a/12714084/220825
	function fixTouch(touch) {
		var winPageX = window.pageXOffset
			, winPageY = window.pageYOffset
			, x = touch.clientX
			, y = touch.clientY;
		if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) || touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
			// iOS4 clientX/clientY have the value that should have been in pageX/pageY. While pageX/page/ have the value 0
			x = x - winPageX;
			y = y - winPageY;
		} else if (y < (touch.pageY - winPageY) || x < (touch.pageX - winPageX)) {
			// Some Android browsers have totally bogus values for clientX/Y when scrolling/zooming a page. Detectable since clientX/clientY should never be smaller than pageX/pageY minus page scroll
			x = touch.pageX - winPageX;
			y = touch.pageY - winPageY;
		}
		return {
			clientX: x
			, clientY: y
		};
	}
	/**
	 * Simulate a mouse event based on a corresponding touch event
	 * @param {Object} event A touch event
	 * @param {String} simulatedType The corresponding mouse event
	 */
	function simulateMouseEvent(event, simulatedType) {
		// Ignore multi-touch events
		if ((!pointerEnabled && event.originalEvent.touches.length > 1) || (pointerEnabled && !event.isPrimary)) return;
		var touch = pointerEnabled ? event.originalEvent : event.originalEvent.changedTouches[0]
			, simulatedEvent = document.createEvent('MouseEvents')
			, coord = fixTouch(touch);
		// Check if element is an input or a textarea
		if (jQuery(touch.target).is('input') || jQuery(touch.target).is('textarea')) event.stopPropagation();
		else event.preventDefault();
		// Initialize the simulated mouse event using the touch event's coordinates
		simulatedEvent.initMouseEvent(
			simulatedType                    // type
			, true                           // bubbles                    
			, true                           // cancelable                 
			, window                         // view                       
			, 1                              // detail                     
			, event.screenX || touch.screenX // screenX                    
			, event.screenY || touch.screenY // screenY                    
			, event.clientX || coord.clientX // clientX                    
			, event.clientY || coord.clientY // clientY                    
			, false                          // ctrlKey                    
			, false                          // altKey                     
			, false                          // shiftKey                   
			, false                          // metaKey                    
			, 0                              // button                     
			, null                           // relatedTarget              
		);
		// Dispatch the simulated event to the target element
		event.target.dispatchEvent(simulatedEvent);
	}
	/**
	 * Handle the jQuery UI widget's touchstart events
	 * @param {Object} event The widget element's touchstart event
	 */
	mouseProto._touchStart = function(event) {
		// Ignore the event if another widget is already being handled
		if (touchHandled || (!pointerEnabled && !this._mouseCapture(event.originalEvent.changedTouches[0]))) return;
		// Set the flag to prevent other widgets from inheriting the touch event
		touchHandled = true;
		// Track movement to determine if interaction was a click
		this._touchMoved = 0;
		// Simulate the mouseover event
		simulateMouseEvent(event, 'mouseover');
		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');
		// Simulate the mousedown event
		simulateMouseEvent(event, 'mousedown');
	};
	/**
	 * Handle the jQuery UI widget's touchmove events
	 * @param {Object} event The document's touchmove event
	 */
	mouseProto._touchMove = function(event) {
		// Ignore event if not handled
		if (!touchHandled) return;
		// Interaction was less likely to be a click
		this._touchMoved +=1;
		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');
	};
	/**
	 * Handle the jQuery UI widget's touchend events
	 * @param {Object} event The document's touchend event
	 */
	mouseProto._touchEnd = function(event) {
		// Ignore event if not handled
		if (!touchHandled) return;
		// Simulate the mouseup event
		simulateMouseEvent(event, 'mouseup');
		// Simulate the mouseout event
		simulateMouseEvent(event, 'mouseout');
		// If the touch interaction did not move (much), it should trigger a click
		if (this._touchMoved <= 5) simulateMouseEvent(event, 'click');
		// Unset the flag to allow other widgets to inherit the touch event
		touchHandled = false;
	};
	/**
	 * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
	 * This method extends the widget with bound touch event handlers that
	 * translate touch events to mouse events and pass them to the widget's
	 * original mouse event handling methods.
	 */
	mouseProto._mouseInit = function() {
		// Delegate the touch handlers to the widget's element
		this.element.on({
			'touchstart'      : jQuery.proxy(this, '_touchStart')
			, 'touchmove'     : jQuery.proxy(this, '_touchMove')
			, 'touchend'      : jQuery.proxy(this, '_touchEnd')
			, 'pointerDown'   : jQuery.proxy(this, '_touchStart')
			, 'pointerMove'   : jQuery.proxy(this, '_touchMove')
			, 'pointerUp'     : jQuery.proxy(this, '_touchEnd')
			, 'MSPointerDown' : jQuery.proxy(this, '_touchStart')
			, 'MSPointerMove' : jQuery.proxy(this, '_touchMove')
			, 'MSPointerUp'   : jQuery.proxy(this, '_touchEnd')
		});
		// Call the original $.ui.mouse init method
		_mouseInit.call(this);
	};
	/**
	 * Remove the touch event handlers
	 */
	mouseProto._mouseDestroy = function() {
		// Delegate the touch handlers to the widget's element
		this.element.off({
			'touchstart'      : jQuery.proxy(this, '_touchStart')
			, 'touchmove'     : jQuery.proxy(this, '_touchMove')
			, 'touchend'      : jQuery.proxy(this, '_touchEnd')
			, 'pointerDown'   : jQuery.proxy(this, '_touchStart')
			, 'pointerMove'   : jQuery.proxy(this, '_touchMove')
			, 'pointerUp'     : jQuery.proxy(this, '_touchEnd')
			, 'MSPointerDown' : jQuery.proxy(this, '_touchStart')
			, 'MSPointerMove' : jQuery.proxy(this, '_touchMove')
			, 'MSPointerUp'   : jQuery.proxy(this, '_touchEnd')
		});
		// Call the original $.ui.mouse destroy method
		_mouseDestroy.call(this);
	};
});