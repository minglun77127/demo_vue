(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueRx = factory());
}(this, (function () { 'use strict';

var Rx$1;
var Vue$1;
var warn = function () {};

function install (_Vue, _Rx) {
  Rx$1 = _Rx;
  Vue$1 = _Vue;
  warn = Vue$1.util.warn || warn;
}

function hasRx (vm) {
  if (!Rx$1) {
    warn(
      '$watchAsObservable requires Rx to be present globally or ' +
      'be passed to Vue.use() as the second argument.',
      vm
    );
    return false
  }
  return true
}

function isObservable (ob) {
  return ob && typeof ob.subscribe === 'function'
}

function isSubject (subject) {
  return subject && (
    typeof subject.next === 'function' ||
    typeof subject.onNext === 'function'
  )
}

function unsub (handle) {
  if (!handle) { return }
  if (handle.dispose) {
    handle.dispose();
  } else if (handle.unsubscribe) {
    handle.unsubscribe();
  }
}

function getDisposable (target) {
  if (Rx$1.Subscription) { // Rx5
    return new Rx$1.Subscription(target)
  } else { // Rx4
    return Rx$1.Disposable.create(target)
  }
}

function defineReactive (vm, key, val) {
  if (key in vm) {
    vm[key] = val;
  } else {
    Vue$1.util.defineReactive(vm, key, val);
  }
}

function getKey (binding) {
  return [binding.arg].concat(Object.keys(binding.modifiers)).join(':')
}

var rxMixin = {
  created: function created () {
    var vm = this;
    var domStreams = vm.$options.domStreams;
    if (domStreams) {
      if (!Rx$1.Subject) {
        warn('Rx.Subject is required to use the "domStreams" option.');
      } else {
        domStreams.forEach(function (key) {
          vm[key] = new Rx$1.Subject();
        });
      }
    }

    var obs = vm.$options.subscriptions;
    if (typeof obs === 'function') {
      obs = obs.call(vm);
    }
    if (obs) {
      vm.$observables = {};
      vm._obSubscriptions = [];
      Object.keys(obs).forEach(function (key) {
        defineReactive(vm, key, undefined);
        var ob = vm.$observables[key] = obs[key];
        if (!isObservable(ob)) {
          warn(
            'Invalid Observable found in subscriptions option with key "' + key + '".',
            vm
          );
          return
        }
        vm._obSubscriptions.push(obs[key].subscribe(function (value) {
          vm[key] = value;
        }));
      });
    }
  },

  beforeDestroy: function beforeDestroy () {
    if (this._obSubscriptions) {
      this._obSubscriptions.forEach(unsub);
    }
  }
};

var streamDirective = {
  // Example ./example/counter_dir.html
  bind: function bind (el, binding, vnode) {
    if (!hasRx()) {
      return
    }

    var handle = binding.value;
    var event = binding.arg;
    var streamName = binding.expression;

    if (isSubject(handle)) {
      handle = { subject: handle };
    } else if (!handle || !isSubject(handle.subject)) {
      warn(
        'Invalid Subject found in directive with key "' + streamName + '".' +
        streamName + ' should be an instance of Rx.Subject or have the ' +
        'type { subject: Rx.Subject, data: any }.',
        vnode.context
      );
      return
    }

    var subject = handle.subject;
    var next = (subject.next || subject.onNext).bind(subject);

    if (vnode.componentInstance) {
      handle.subscription = vnode.componentInstance.$eventToObservable(event).subscribe(function (e) {
        next({
          event: e,
          data: handle.data
        });
      });
    } else {
      if (!Rx$1.Observable.fromEvent) {
        warn(
          "No 'fromEvent' method on Observable class. " +
          "v-stream directive requires Rx.Observable.fromEvent method. " +
          "Try import 'rxjs/add/observable/fromEvent' for " + streamName,
          vnode.context
        );
        return
      }
      var fromEventArgs = handle.options ? [el, event, handle.options] : [el, event];
      handle.subscription = (ref = Rx$1.Observable).fromEvent.apply(ref, fromEventArgs).subscribe(function (e) {
        next({
          event: e,
          data: handle.data
        });
      })

      // store handle on element with a unique key for identifying
      // multiple v-stream directives on the same node
      ;(el._rxHandles || (el._rxHandles = {}))[getKey(binding)] = handle;
    }
    var ref;
  },

  update: function update (el, binding) {
    var handle = binding.value;
    var _handle = el._rxHandles && el._rxHandles[getKey(binding)];
    if (_handle && handle && isSubject(handle.subject)) {
      _handle.data = handle.data;
    }
  },

  unbind: function unbind (el, binding) {
    var key = getKey(binding);
    var handle = el._rxHandles && el._rxHandles[key];
    if (handle) {
      unsub(handle.subscription);
      el._rxHandles[key] = null;
    }
  }
};

function watchAsObservable (expOrFn, options) {
  if (!hasRx()) {
    return
  }

  var vm = this;
  var obs$ = Rx$1.Observable.create(function (observer) {
    var _unwatch;
    var watch = function () {
      _unwatch = vm.$watch(expOrFn, function (newValue, oldValue) {
        observer.next({ oldValue: oldValue, newValue: newValue });
      }, options);
    };

    // if $watchAsObservable is called inside the subscriptions function,
    // because data hasn't been observed yet, the watcher will not work.
    // in that case, wait until created hook to watch.
    if (vm._data) {
      watch();
    } else {
      vm.$once('hook:created', watch);
    }

    // Returns function which disconnects the $watch expression
    return getDisposable(function () {
      _unwatch && _unwatch();
    })
  });

  return obs$
}

function fromDOMEvent (selector, event) {
  if (!hasRx()) {
    return
  }
  if (typeof window === 'undefined') {
    return Rx$1.Observable.create(function () {})
  }

  var vm = this;
  var doc = document.documentElement;
  var obs$ = Rx$1.Observable.create(function (observer) {
    function listener (e) {
      if (!vm.$el) { return }
      if (selector === null && vm.$el === e.target) { return observer.next(e) }
      var els = vm.$el.querySelectorAll(selector);
      var el = e.target;
      for (var i = 0, len = els.length; i < len; i++) {
        if (els[i] === el) { return observer.next(e) }
      }
    }
    doc.addEventListener(event, listener);
    // Returns function which disconnects the $watch expression
    return getDisposable(function () {
      doc.removeEventListener(event, listener);
    })
  });

  return obs$
}

function subscribeTo (observable, next, error, complete) {
  var obs$ = observable.subscribe(next, error, complete);(this._obSubscriptions || (this._obSubscriptions = [])).push(obs$);
  return obs$
}

/**
 * @see {@link https://vuejs.org/v2/api/#vm-on}
 * @param {String||Array} evtName Event name
 * @return {Observable} Event stream
 */
function eventToObservable (evtName) {
  if (!hasRx()) {
    return
  }
  var vm = this;
  var evtNames = Array.isArray(evtName) ? evtName : [evtName];
  var obs$ = Rx$1.Observable.create(function (observer) {
    var eventPairs = evtNames.map(function (name) {
      var callback = function (msg) { return observer.next({ name: name, msg: msg }); };
      vm.$on(name, callback);
      return { name: name, callback: callback }
    });
    return function () {
      // Only remove the specific callback
      eventPairs.forEach(function (pair) { return vm.$off(pair.name, pair.callback); });
    }
  });

  return obs$
}

/* global Vue, Rx */

function VueRx (Vue$$1, Rx$$1) {
  install(Vue$$1, Rx$$1);
  Vue$$1.mixin(rxMixin);
  Vue$$1.directive('stream', streamDirective);
  Vue$$1.prototype.$watchAsObservable = watchAsObservable;
  Vue$$1.prototype.$fromDOMEvent = fromDOMEvent;
  Vue$$1.prototype.$subscribeTo = subscribeTo;
  Vue$$1.prototype.$eventToObservable = eventToObservable;
}

// auto install
if (typeof Vue !== 'undefined' && typeof Rx !== 'undefined') {
  Vue.use(VueRx, Rx);
}

return VueRx;

})));
