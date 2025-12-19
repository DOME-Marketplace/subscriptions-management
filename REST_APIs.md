# Subscriptions Management

**Version:** 1.0.0  
**Description:** Swagger REST APIs for the subscriptions-management software  


## REST API Endpoints

### Subscriptions Management Controller
| Verb | Path | Task |
|------|------|------|
| GET | `/organizations/{organizationId}/subscriptions` | listSubscriptions |
| POST | `/organizations/{organizationId}/subscriptions` | saveProduct |
| PATCH | `/organizations/{organizationId}/subscriptions/{subscriptionId}` | updateProduct |
| GET | `/plans/active` | listProductOfferingPlans |
| GET | `/organizations` | listOrganizations |
| GET | `/configuration` | getConfiguration |

### Subscriptions Info Controller
| Verb | Path | Task |
|------|------|------|
| GET | `/status/info` | getInfo |
| GET | `/status/health` | getHealth |

