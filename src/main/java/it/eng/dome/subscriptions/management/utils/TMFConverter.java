package it.eng.dome.subscriptions.management.utils;

import it.eng.dome.tmforum.tmf678.v4.model.RelatedParty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class TMFConverter {

    private static final Logger logger = LoggerFactory.getLogger(TMFConverter.class);

    public static List<RelatedParty> convertRelatedPartiesTo678(List<it.eng.dome.tmforum.tmf637.v4.model.RelatedParty> list637) {

        if (list637 == null) {
            return null;
        }

        List<it.eng.dome.tmforum.tmf678.v4.model.RelatedParty> list678 = new ArrayList<>();

        for (it.eng.dome.tmforum.tmf637.v4.model.RelatedParty rp637 : list637) {
            it.eng.dome.tmforum.tmf678.v4.model.RelatedParty rp678 = new it.eng.dome.tmforum.tmf678.v4.model.RelatedParty();

            rp678.setId(rp637.getId());
            try {
                rp678.setHref(new URI(Objects.requireNonNull(rp637.getHref())));
            } catch (URISyntaxException e) {
                logger.warn("Invalid URI for RelatedParty href={} -> {}", rp637.getHref(), e.getMessage());
            }
            rp678.setName(rp637.getName());
            rp678.setRole(rp637.getRole());
            rp678.setAtReferredType(rp637.getAtReferredType()); // ??

            list678.add(rp678);
        }

        return list678;
    }

    public static it.eng.dome.tmforum.tmf678.v4.model.BillingAccountRef convertBillingAccountRefTo678(
            it.eng.dome.tmforum.tmf637.v4.model.BillingAccountRef in) {

        if (in == null) {
            return null;
        }

        it.eng.dome.tmforum.tmf678.v4.model.BillingAccountRef out = new it.eng.dome.tmforum.tmf678.v4.model.BillingAccountRef();
        out.setId(in.getId());
        out.setHref(in.getHref());
        out.setName(in.getName());

        return out;
    }
}
