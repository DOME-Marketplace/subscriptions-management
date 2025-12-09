package it.eng.dome.subscriptions.management.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Subscription {

    private String organizationId;
    private String productOfferingId;
    private String productOfferingPriceId;
    private Map<String, String> characteristics;

    public String getOrganizationId() {
        return organizationId;
    }
    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }
    public String getProductOfferingId() {
        return productOfferingId;
    }
    public void setProductOfferingId(String productOfferingId) {
        this.productOfferingId = productOfferingId;
    }
    public String getProductOfferingPriceId() {
        return productOfferingPriceId;
    }
    public void setProductOfferingPriceId(String productOfferingPriceId) {
        this.productOfferingPriceId = productOfferingPriceId;
    }
    public Map<String, String> getCharacteristics() {
        return characteristics;
    }
    public void setCharacteristics(Map<String, String> characteristics) {
        this.characteristics = characteristics;
    }

}
