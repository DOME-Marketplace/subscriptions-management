# Subscriptions Management

**Version:** 0.0.2  
**Description:** Swagger REST APIs for the subscriptions-management software  


## REST API Endpoints

### Subscriptions Management Controller
| Verb | Path | Task |
|------|------|------|
| POST | `/management/subscription/update` | updateProduct |
| POST | `/management/product/save` | saveProduct |
| GET | `/management/subscription/statuses` | getSubscriptionStatuses |
| GET | `/management/productOffering/validPlans` | listProductOfferingPlans |
| GET | `/management/organizations` | listOrganizations |
| GET | `/management/organizations/{organizationId}/purchasedProducts` | listPurchasedProducts |
| GET | `/management/organizations/{organizationId}/otherProducts` | getOtherProducts |

### Subscriptions Info Controller
| Verb | Path | Task |
|------|------|------|
| GET | `/subscriptions/info` | getInfo |
| GET | `/subscriptions/health` | getHealth |

