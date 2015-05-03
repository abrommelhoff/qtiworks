package geometrydrawing;

import uk.ac.ed.ph.jqtiplus.exception.ResponseBindingException;
import uk.ac.ed.ph.jqtiplus.group.content.ObjectGroup;
import uk.ac.ed.ph.jqtiplus.group.item.interaction.choice.GapImgGroup;
import uk.ac.ed.ph.jqtiplus.group.item.interaction.graphic.AssociableHotspotGroup;
import uk.ac.ed.ph.jqtiplus.node.QtiNode;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.object.Object;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.CustomInteraction;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.graphic.AssociableHotspot;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.graphic.AssociableHotspotContainer;
import uk.ac.ed.ph.jqtiplus.node.item.response.declaration.ResponseDeclaration;
import uk.ac.ed.ph.jqtiplus.running.InteractionBindingContext;
import uk.ac.ed.ph.jqtiplus.types.ResponseData;
import uk.ac.ed.ph.jqtiplus.types.StringResponseData;
import uk.ac.ed.ph.jqtiplus.validation.ValidationContext;
import uk.ac.ed.ph.jqtiplus.value.MultipleValue;
import uk.ac.ed.ph.jqtiplus.value.Signature;
import uk.ac.ed.ph.jqtiplus.value.SingleValue;
import uk.ac.ed.ph.jqtiplus.value.Value;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class FigurePlacementInteraction extends CustomInteraction<FigurePlacementExtensionPackage> implements AssociableHotspotContainer {

    //private static final long serialVersionUID = 6364289440013765516L;
	private static final long serialVersionUID = 31415;

	/** Name of this class in xml schema. */
    public static final String QTI_CLASS_NAME = "figurePlacementInteraction";

    public FigurePlacementInteraction(final QtiNode parent) {
        super(parent);

        getNodeGroups().add(new ObjectGroup(this, true));
        getNodeGroups().add(new GapImgGroup(this, 1));
        getNodeGroups().add(new AssociableHotspotGroup(this, 1));
    }

    public Object getObject() {
        return getNodeGroups().getObjectGroup().getObject();
    }

    public void setObject(final Object object) {
        getNodeGroups().getObjectGroup().setObject(object);
    }

    public List<AssociableHotspot> getAssociableHotspots() {
        return getNodeGroups().getAssociableHotspotGroup().getAssociableHotspots();
    }


    @Override
    public void validateThis(final FigurePlacementExtensionPackage jqtiExtensionPackage, final ValidationContext context, final ResponseDeclaration responseDeclaration) {
        if (responseDeclaration!=null) {
            context.checkSignature(this, responseDeclaration, Signature.MULTIPLE_STRING);
        }

        final Object object = getObject();
        if (object != null && object.getType() != null && !object.getType().startsWith("image/")) {
            context.fireValidationError(this, "Object child must have an image type");
        }
    }

    @Override
    protected Value parseResponse(final FigurePlacementExtensionPackage figurePlacementExtensionPackage, final ResponseDeclaration responseDeclaration, final ResponseData responseData)
            throws ResponseBindingException {
        final Value responseValue;
        // parse responseValue into a stringResponseValue for easier consumption by parseSingleValueLax
        final List<String> stringResponseData = ((StringResponseData) responseData).getResponseData();
        //responseValue = responseDeclaration.getBaseType().parseSingleValueLax(stringResponseData.get(0));
        //responseValue = MultipleValue.createMultipleValue(responseDeclaration.getBaseType().parseSingleValueLax(stringResponseData.get(0)));
        final Collection<SingleValue> responseCollection = new ArrayList<SingleValue>();
        for (int a = 0; a < stringResponseData.size(); a++) {
            responseCollection.add(responseDeclaration.getBaseType().parseSingleValueLax(stringResponseData.get(a)));
        }
        responseValue = MultipleValue.createMultipleValue(responseCollection);
        return responseValue;
    }

    @Override
    protected boolean validateResponse(final FigurePlacementExtensionPackage jqtiExtensionPackage, final InteractionBindingContext interactionBindingContext, final Value responseValue) {
    	if (!responseValue.isNull() && responseValue.toQtiString().length() > 0) {
        	return true;
        } else {
        	return false;
        }
    }
}
