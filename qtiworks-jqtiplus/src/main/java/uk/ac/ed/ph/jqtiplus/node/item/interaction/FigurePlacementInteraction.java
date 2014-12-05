package uk.ac.ed.ph.jqtiplus.node.item.interaction;

import uk.ac.ed.ph.jqtiplus.group.content.ObjectGroup;
import uk.ac.ed.ph.jqtiplus.group.item.interaction.choice.GapImgGroup;
import uk.ac.ed.ph.jqtiplus.group.item.interaction.graphic.AssociableHotspotGroup;
import uk.ac.ed.ph.jqtiplus.node.QtiNode;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.object.Object;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.graphic.AssociableHotspot;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.graphic.AssociableHotspotContainer;
import uk.ac.ed.ph.jqtiplus.node.item.response.declaration.ResponseDeclaration;
import uk.ac.ed.ph.jqtiplus.running.InteractionBindingContext;
import uk.ac.ed.ph.jqtiplus.validation.ValidationContext;
import uk.ac.ed.ph.jqtiplus.value.Signature;
import uk.ac.ed.ph.jqtiplus.value.Value;

import java.util.List;


public final class FigurePlacementInteraction extends BlockInteraction implements AssociableHotspotContainer {

    private static final long serialVersionUID = 6364289440013765516L;

    /** Name of this class in xml schema. */
    public static final String QTI_CLASS_NAME = "figurePlacementInteraction";

    public FigurePlacementInteraction(final QtiNode parent) {
        super(parent, QTI_CLASS_NAME);

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
    public void validateThis(final ValidationContext context, final ResponseDeclaration responseDeclaration) {
        if (responseDeclaration!=null) {
            context.checkSignature(this, responseDeclaration, Signature.MULTIPLE_STRING);
        }

        final Object object = getObject();
        if (object != null && object.getType() != null && !object.getType().startsWith("image/")) {
            context.fireValidationError(this, "Object child must have an image type");
        }
    }

    @Override
    public boolean validateResponse(final InteractionBindingContext interactionBindingContext, final Value responseValue) {
        /* We assume anything is valid here */
        return true;
    }
}
