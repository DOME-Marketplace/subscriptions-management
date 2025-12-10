# Release Notes
 
**Release Notes** of the *Subscriptions Management*

### <code>0.1.1</code> :calendar: 10/12/2025
**Improvements**
* temporarily removed status 'aborted'
* Fixed various CSS issues.

### <code>0.1.0</code> :calendar: 09/12/2025
**Feature**
* Introduced Plan and Subscription class.
* Added `tool_operator.idm_id` property to `application.yaml` for configuration.
* Added ability to retrieve an Organization by its idm_id.

**Improvement**
* Moved configurable characteristics to the backend.
* Updated account endpoint in local environment.
* Added lock to prevent opening more than one editor simultaneously.
* Added lock to prevent closing a panel when an editor is still open.

**Bug Fix**
* Fixed activation date and termination date handling.
* Post filtering on retrieved subscriptions (buyer id).
* Fixed various CSS.

### <code>0.0.2</code> :calendar: 09/12/2025
**Feature**
* Add `TrailingSlashFilter` filter to remove trailing slash from request path.
* Generate automatic `REST_APIs.md` file from **OpenAPI** using the `generate-rest-apis` profile.
* Usage of `AbstractHealthService` class from `Brokerage Utils` to manage **getInfo()** and **getHealth()** features.
* Usage of the `getChecksOnSelf` from `AbstractHealthService` of last version of `brokerage-utils`.
* Usage of the `AbstractMarkdownGenerator` class to generate `REST_APIs.md`.

**Improvements**
* Update **javascripts** and **css layout** in the front-end.

### <code>0.0.1</code> :calendar: 05/12/2025
**Feature**
* Init project.
* Initial release of the Subscriptions Management project, providing basic functionality for managing `revenue-engine` subscriptions.