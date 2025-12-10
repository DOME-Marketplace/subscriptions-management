# Subscriptions Management

**Version:** 0.1.0  
**Description:** Swagger REST APIs for the subscriptions-management software  


## REST API Endpoints

### Subscriptions Management Controller
| Verb | Path | Task |
|------|------|------|
| POST | `/management/organizations/{organizationId}/subscription` | saveProduct |
| PATCH | `/management/organizations/{organizationId}/subscription/{subscriptionId}` | updateProduct |
| GET | `/management/subscription/statuses` | getSubscriptionStatuses |
| GET | `/management/plans/active` | listProductOfferingPlans |
| GET | `/management/organizations` | listOrganizations |
| GET | `/management/organizations/{organizationId}/subscriptions` | listSubscriptions |
| GET | `/management/configuration` | getConfiguration |

### Subscriptions Info Controller
| Verb | Path | Task |
|------|------|------|
| GET | `/subscriptions/info` | getInfo |
| GET | `/subscriptions/health` | getHealth |

