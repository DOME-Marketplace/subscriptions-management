package it.eng.dome.subscriptions.management.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Plan {

	private String name;
	private String description;	
	private String offeringId;	
	private String offeringPriceId;

    private List<ConfigurableCharacteristic> configurableCharacteristics;

    public Plan() {
        this.configurableCharacteristics = new ArrayList<>();
    }

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

    public void addConfigurableCharacteristic(ConfigurableCharacteristic cc) {
        this.configurableCharacteristics.add(cc);
    }

    public List<ConfigurableCharacteristic> getConfigurableCharacteristics() {
        return configurableCharacteristics;
    }

    public void setConfigurableCharacteristics(List<ConfigurableCharacteristic> configurableCharacteristics) {
        this.configurableCharacteristics = configurableCharacteristics;
    }

    

}
