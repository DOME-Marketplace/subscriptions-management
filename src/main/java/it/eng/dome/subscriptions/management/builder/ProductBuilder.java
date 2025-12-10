package it.eng.dome.subscriptions.management.builder;

import it.eng.dome.subscriptions.management.model.Role;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPrice;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPriceRefOrValue;
import it.eng.dome.tmforum.tmf632.v4.model.ExternalReference;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.*;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.service.TMFDataRetriever;
import it.eng.dome.subscriptions.management.utils.TMFUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ProductBuilder {

    private final TMFDataRetriever tmfDataRetriever;
    private final String toolOperatorIdm_id;

    public ProductBuilder(TMFDataRetriever retriever, String idm_id) {
        this.tmfDataRetriever = retriever;
        this.toolOperatorIdm_id = idm_id;
    }

    public ProductCreate build(ProductOffering offering,
                                Organization buyer,
                                BillingAccountRef baRef,
                                Map<String, String> characteristics)
            throws BadTmfDataException, ExternalServiceException {

        ProductCreate product = new ProductCreate();

        product.setName(buyer.getTradingName() + " subscription to DOME");
        product.setBillingAccount(baRef);
        product.setStatus(ProductStatusType.CREATED);

        // start time -> pick from characteristics (and remove from them)
        if(characteristics!=null) {
            String stringDate = characteristics.get("activationDate");
            if(stringDate!=null) {
                stringDate+="0000";
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-ddHHmm");
                LocalDateTime datetime = LocalDateTime.parse(stringDate, formatter);
                ZonedDateTime zoned = datetime.atZone(ZoneId.of("UTC"));
                OffsetDateTime startDate = zoned.toOffsetDateTime();
                product.setStartDate(startDate);
                characteristics.remove("activationDate");
            }
        }
        if(product.getStartDate()==null)
            product.setStartDate(OffsetDateTime.now());

        // --- Characteristics ---
        product.setProductCharacteristic(buildCharacteristics(characteristics));

        // --- Offering ref ---
        product.setProductOffering(TMFUtils.toProductOfferingRef(offering));

        // --- Prices ---
        product.setProductPrice(buildPrices(offering));

        // --- Related Parties ---
        product.setRelatedParty(buildRelatedParties(offering, buyer));

        return product;
    }

    private List<Characteristic> buildCharacteristics(Map<String, String> characteristics) {
        List<Characteristic> chars = new ArrayList<>();

        for(String key: characteristics.keySet()) {
            String value = characteristics.get(key);
            if (key != null && value!=null) {
                Characteristic c = new Characteristic();
                c.setName(key);
                c.setValue(value);
                chars.add(c);
            }
        }

        return chars;
    }

    private List<ProductPrice> buildPrices(ProductOffering offering)
            throws BadTmfDataException, ExternalServiceException {

        List<ProductPrice> prices = new ArrayList<>();

        List<ProductOfferingPriceRefOrValue> poPrices = offering.getProductOfferingPrice();
        if (poPrices == null || poPrices.isEmpty()) {
            return prices; // safe fallback
        }

        for (ProductOfferingPriceRefOrValue popRef : poPrices) {
            ProductOfferingPrice fullPop =
                    tmfDataRetriever.getProductOfferingPrice(popRef.getId(), null);

            ProductPrice pp = new ProductPrice();
            pp.setProductOfferingPrice(TMFUtils.toProductOfferingPriceRef(fullPop));

            prices.add(pp);
        }

        return prices;
    }

    private List<RelatedParty> buildRelatedParties(ProductOffering offering, Organization buyer) throws ExternalServiceException, BadTmfDataException {
        List<RelatedParty> parties = new ArrayList<>();

        // Buyer
        RelatedParty buyerRP = new RelatedParty();
        buyerRP.setId(buyer.getId());
        buyerRP.setHref(buyer.getHref());
        buyerRP.setName(this.extractIdmId(buyer));
        buyerRP.setRole("Buyer");
        buyerRP.setAtReferredType("organization");

        parties.add(buyerRP);

        List<it.eng.dome.tmforum.tmf620.v4.model.RelatedParty> offeringRps = offering.getRelatedParty();
        // Seller (from offering)
        RelatedParty seller = TMFUtils.getRelatedPartyWithRole(
                TMFUtils.convertRpTo637(offeringRps),
                String.valueOf((Role.SELLER))
        );
        if (seller != null) {
            parties.add(seller);
        }

        //SellerOperator
        RelatedParty sellerOp = TMFUtils.getRelatedPartyWithRole(
                TMFUtils.convertRpTo637(offeringRps),
                String.valueOf((Role.SELLER_OPERATOR))
        );
        if (sellerOp != null) {
            parties.add(sellerOp);
        }

        //BuyerOperator
        Organization bOp = this.tmfDataRetriever.getOrganizationByIdmId(this.toolOperatorIdm_id);
        RelatedParty buyerOp = new RelatedParty();
        buyerOp.setId(bOp.getId());
        buyerOp.setHref(bOp.getHref());
        buyerOp.setName(this.toolOperatorIdm_id);
        buyerOp.setRole(String.valueOf(Role.BUYER_OPERATOR));
        buyerOp.setAtReferredType(bOp.getAtType());
        parties.add(buyerOp);

        return parties;
    }

    private String extractIdmId(Organization org) {
        if (org.getExternalReference() != null) {
            for (ExternalReference ext : org.getExternalReference()) {
                if ("idm_id".equalsIgnoreCase(ext.getExternalReferenceType())) {
                    return ext.getName();
                }
            }
        }
        return null;
    }
}