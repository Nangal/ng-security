/*
 ngsecurity v1.2.0
 (c) 2015 Concrete Solutions, Inc.
 License: MIT
*/
'use strict';
(function () {angular.module('ngSecurity', [
  'ngCookies'
]);

angular
  .module('ngSecurity')
  .directive('ngIfAuthenticated', ifAuthenticated)
  .directive('ngIfAnonymous', ifAnonymous)
  .directive('ngIfPermission', ifPermission)
  .directive('ngIfPermissionModel', ifPermissionModel)
  .directive('ngEnabledPermission', enabledPermission);

ifAuthenticated.$inject = ['$security'];
ifAnonymous.$inject = ['$security'];
ifPermission.$inject = ['$security'];
ifPermissionModel.$inject = ['$security', '$parse'];
enabledPermission.$inject = ['$security'];

function ifAuthenticated ($security) {
  /** interface */
  var directive = {
    link: link,
    restrict: 'A'
  };

  return directive;

  /** implementation */
  function link (scope, element, attrs) {
    var defaultStyle = element.css('display');
    scope.$watch(function () {
      return $security.isAuthenticated();
    }, function (authorization) {
      if (authorization) {
        element.css('display', defaultStyle);
      } else {
        element.css('display', 'none');
      }
    });
  }
}

function ifAnonymous ($security) {
  /** interface */
  var directive = {
    link: link,
    restrict: 'A'
  };

  return directive;

  /** implementation */
  function link (scope, element, attrs) {
    var defaultStyle = element.css('display');
    scope.$watch(function () {
      return $security.isAuthenticated();
    }, function (authorization) {
      if (authorization) {
        element.css('display', 'none');
      } else {
        element.css('display', defaultStyle);
      }
    });
  }
}

function ifPermission ($security) {
  /** interface */
  var directive = {
    link: link,
    restrict: 'A'
  };

  return directive;

  /** implementation */
  function link (scope, element, attrs) {
    var defaultStyle = element.css('display'),
        permissionType = attrs.ngPermissionType;
    scope.$watch(function () {
      return attrs.ngIfPermission;
    }, function (permission) {
      var permissions = permission.split(',');
      if ($security.getPermissionValidation(permissionType)(permissions)) {
        element.css('display', defaultStyle);
      } else {
        element.css('display', 'none');
      }
    });
  }
}

function ifPermissionModel ($security, $parse) {
  /** interface */
  var directive = {
    link: link,
    restrict: 'A'
  };

  return directive;

  /** implementation */
  function link (scope, element, attrs) {
    var defaultStyle = element.css('display'),
        permissionType = attrs.ngPermissionType;

    scope.$watch(function () {
      return $parse(attrs.ngIfPermissionModel)(scope);
    }, function (permissions) {
      if ($security.hasPermission(permissions) || $security.getPermissionValidation(permissionType)(permissions)) {
        element.css('display', defaultStyle);
      } else {
        element.css('display', 'none');
      }
    });
  }
}

function enabledPermission ($security) {
  /** interface */
  var directive = {
    link: link,
    restrict: 'A'
  };

  return directive;

  /** implementation */
  function link (scope, element, attrs) {
    var permissionType = attrs.ngPermissionType;

    scope.$watch(function () {
      return attrs.ngEnabledPermission;
    }, function (permission) {
      var permissions = permission.split(',');
      if ($security.getPermissionValidation(permissionType)(permissions)) {
        element.removeAttr('disabled');
      } else {
        element.attr('disabled', 'true');
      }
    });
  }
}

angular
  .module('ngSecurity')
  .provider('$securityConfig', securityConfigProvider);

function securityConfigProvider () {
  var provider = {};
  var config = {
    strategy: 'simple',
    token: {
      header: 'Authorization',
      prefix: ''
    },
    storageName: {
      token: 'ng-security-authorization',
      user: 'ng-security-user',
      permissions: 'ng-security-permissions'
    },
    responseErrorName: {
      401: 'unauthenticated',
      403: 'permissionDenied'
    }
  };

  provider.$get = function () {
    return config;
  };

  provider.configure = function (options) {
    config = angular.merge(config, options);
  };

  return provider;
}

angular
  .module('ngSecurity')
  .factory('$security', securityFactory)
  .factory('$securityInterceptor', securityInterceptor);

securityFactory.$inject = ['$cookies', '$q', '$http', '$securityConfig'];
securityInterceptor.$inject = ['$rootScope', '$q', '$cookies', '$securityConfig'];

function securityFactory ($cookies, $q, $http, $securityConfig) {
  /** interface */
  var security = {
    login: login,
    loginByUrl: loginByUrl,
    logout: logout,
    hasPermission: hasPermission,
    hasAllPermission: hasAllPermission,
    hasAnyPermission: hasAnyPermission,
    getPermissionValidation: getPermissionValidation,
    isAuthenticated: isAuthenticated,
    getUser: getUser
  }, authStrategy = {
    'jwt': authStrategyJWT,
    'simple': authStrategySimple
  };

  return security;

  /** implementation */
  function login () {
    return authStrategy[$securityConfig.strategy].apply(this, arguments);
  }

  function authStrategyJWT(token, permissions) {
    var user,
        userEncoded;
    userEncoded = token.split('.')[1];
    if ((userEncoded.length % 4) === 2) {
      userEncoded += '==';
    } else if ((userEncoded.length % 4) === 3) {
      userEncoded += '=';
    } else if ((userEncoded.length % 4) !== 0) {
      throw 'Invalid token string.';
    }
    user = JSON.parse(atob(userEncoded + '=='));
    $cookies.put($securityConfig.storageName.token, $securityConfig.token.prefix + token);
    $cookies.putObject($securityConfig.storageName.user, user);
    $cookies.putObject($securityConfig.storageName.permissions, permissions);
  }

  function authStrategySimple(token, user, permissions) {
    $cookies.put($securityConfig.storageName.token, $securityConfig.token.prefix + token);
    $cookies.putObject($securityConfig.storageName.user, user);
    $cookies.putObject($securityConfig.storageName.permissions, permissions);
  }

  function loginByUrl (url, data) {
    return $q(function (resolve, reject) {
      $http.post(url, data).success(function (data) {
        security.login(data.token, data.user, data.permissions);
        resolve(data);
      }).error(reject);
    });
  }

  function logout () {
    $cookies.remove($securityConfig.storageName.token);
    $cookies.remove($securityConfig.storageName.user);
    $cookies.remove($securityConfig.storageName.permissions);
  }

  function hasPermission (permissionRequired) {
    var permissions = $cookies.getObject($securityConfig.storageName.permissions);
    return permissions.indexOf(permissionRequired) !== -1;
  }

  function hasAllPermission (permissionsRequired) {
    var permissions = $cookies.getObject($securityConfig.storageName.permissions),
        exists = true;
    if (angular.isDefined(permissionsRequired)) {
      angular.forEach(permissionsRequired, function (permission) {
        if (permissions.indexOf(permission) === -1) {
          exists = false;
        }
      });
    } else {
      exists = false;
    }
    return exists;
  }

  function hasAnyPermission (permissionsRequired) {
    var permissions = $cookies.getObject($securityConfig.storageName.permissions),
        exists = false;
    if (angular.isDefined(permissionsRequired)) {
      angular.forEach(permissionsRequired, function (permission) {
        if (permissions.indexOf(permission) !== -1) {
          exists = true;
        }
      });
    }
    return exists;
  }

  function getPermissionValidation (permissionType) {
    var validations = {
      'ANY': security.hasAnyPermission,
      'ALL': security.hasAllPermission
    };
    if (!permissionType) {
      permissionType = 'ANY';
    }
    return validations[permissionType];
  }

  function isAuthenticated () {
    return !!$cookies.get($securityConfig.storageName.token);
  }

  function getUser () {
    return $cookies.getObject($securityConfig.storageName.user);
  }
}


function securityInterceptor ($rootScope, $q, $cookies, $securityConfig) {
  /** interface */
  var interceptor = {
    request: request,
    responseError: responseError
  };

  return interceptor;

  /** implementation */
  function request (config) {
    config.headers[$securityConfig.token.header] = $cookies.get($securityConfig.storageName.token);
    return config;
  }

  function responseError (response) {
    var events = $securityConfig.responseErrorName;
    if (events[response.status]) {
      $rootScope.$broadcast(events[response.status], response);
    }
    return $q.reject(response);
  }
}
}).call(window);