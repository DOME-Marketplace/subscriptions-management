package it.eng.dome.subscriptions.management.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Plan {

	private String name;
	private String description;	
	private String offeringId;	
	private String offeringPriceId;

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getOfferingId() {
        return offeringId;
    }
    public void setOfferingId(String offeringId) {
        this.offeringId = offeringId;
    }
    public String getOfferingPriceId() {
        return offeringPriceId;
    }
    public void setOfferingPriceId(String offeringPriceId) {
        this.offeringPriceId = offeringPriceId;
    }

}
