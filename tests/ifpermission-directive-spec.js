'use strict';

describe('Directive:ifPermission', function () {
  beforeEach(module('ngSecurity'));
  var $security,
      $compile,
      $rootScope;

  beforeEach(inject(function ($injector) {
    $security = $injector.get('$security');
    $compile = $injector.get('$compile');
    $rootScope = $injector.get('$rootScope');

    $security.logout();
  }));

  it('should show element if have admin permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['admin']);

    var element = $compile([
      '<div ng-if-permission="admin">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), '');
  });

  it('should hide element if not have admin permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['staff']);

    var element = $compile([
      '<div ng-if-permission="admin">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), 'none');
  });

  it('should hide element if not authenticate', function () {
    var element = $compile([
      '<div ng-if-permission="admin">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), 'none');
  });

  it('should show element if have admin or staff permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['staff']);

    var element = $compile([
      '<div ng-if-permission="admin,staff">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), '');
  });

  it('should hide element if not have admin or staff permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['readonly']);

    var element = $compile([
      '<div ng-if-permission="admin,staff">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), 'none');
  });

  it('should show element if have admin and staff permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['admin', 'staff']);

    var element = $compile([
      '<div ng-if-permission="admin,staff" ng-permission-type="ALL">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), '');
  });

  it('should hide element if not have admin and staff permission', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['admin']);

    var element = $compile([
      '<div ng-if-permission="admin,staff" ng-permission-type="ALL">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    assert.equal(element.css('display'), 'none');
  });

  it('should hide element after user logout', function () {
    $security.login('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {}, ['admin']);

    var element = $compile([
      '<div ng-if-permission="admin,staff">',
      '</div>'
    ].join())($rootScope);

    $rootScope.$digest();

    $security.logout();
    
    $rootScope.$digest();

    assert.equal(element.css('display'), 'none');
  });
});
