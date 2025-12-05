package it.eng.dome.subscriptions.management.utils;

import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPrice;
import it.eng.dome.tmforum.tmf637.v4.model.ProductOfferingPriceRef;
import it.eng.dome.tmforum.tmf637.v4.model.ProductOfferingRef;
import it.eng.dome.tmforum.tmf637.v4.model.RelatedParty;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public final class TMFUtils {

    private TMFUtils () {
        // Utility class → private constructor
    }

    // ===========================
    //  RELATED PARTY BY ROLE
    // ===========================
    public static RelatedParty getRelatedPartyWithRole(
            List<RelatedParty> relatedParties,
            String role
    ) {
        if (relatedParties == null || relatedParties.isEmpty() || role == null) {
            return null;
        }

        return relatedParties.stream()
                .filter(rp -> role.equalsIgnoreCase(rp.getRole()))
                .findFirst()
                .orElse(null);
    }

    // ===========================
    //  PRODUCT OFFERING REF
    // ===========================
    public static ProductOfferingRef toProductOfferingRef(ProductOffering productOffering) {
        if (productOffering == null) return null;

        ProductOfferingRef poRef = new ProductOfferingRef();
        poRef.setId(Objects.requireNonNull(productOffering.getId()));
        poRef.setHref(productOffering.getHref());
        poRef.setName(productOffering.getName());

        return poRef;
    }

    // ===========================
    //  PRODUCT OFFERING PRICE REF
    // ===========================
    public static ProductOfferingPriceRef toProductOfferingPriceRef(ProductOfferingPrice pop) {
        if (pop == null) return null;

        ProductOfferingPriceRef popRef = new ProductOfferingPriceRef();
        popRef.setId(Objects.requireNonNull(pop.getId()));
        popRef.setHref(pop.getHref());
        popRef.setName(pop.getName());

        return popRef;
    }

    // ===========================
    //  CONVERT TMF620 → TMF637
    // ===========================
    public static List<RelatedParty> convertRpTo637(
            List<it.eng.dome.tmforum.tmf620.v4.model.RelatedParty> list620) {

        if (list620 == null) {
            return null;
        }

        List<RelatedParty> list637 = new ArrayList<>();
        for (it.eng.dome.tmforum.tmf620.v4.model.RelatedParty rp620 : list620) {
            RelatedParty rp637 = new RelatedParty();

            rp637.setId(rp620.getId());
            rp637.setHref(String.valueOf(rp620.getHref()));
            rp637.setName(rp620.getName());
            rp637.setRole(rp620.getRole());
            rp637.setAtReferredType(rp620.getAtReferredType());

            list637.add(rp637);
        }

        return list637;
    }
}