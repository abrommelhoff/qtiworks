package main.java.geometrydrawing;

import uk.ac.ed.ph.jqtiplus.attribute.value.BooleanAttribute;
import uk.ac.ed.ph.jqtiplus.attribute.value.IntegerAttribute;
import uk.ac.ed.ph.jqtiplus.attribute.value.StringAttribute;
import uk.ac.ed.ph.jqtiplus.exception.ResponseBindingException;
import uk.ac.ed.ph.jqtiplus.group.content.BlockGroup;
import uk.ac.ed.ph.jqtiplus.group.content.ObjectGroup;
import uk.ac.ed.ph.jqtiplus.node.QtiNode;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.object.Object;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.CustomInteraction;
import uk.ac.ed.ph.jqtiplus.node.item.response.declaration.ResponseDeclaration;
import uk.ac.ed.ph.jqtiplus.running.InteractionBindingContext;
import uk.ac.ed.ph.jqtiplus.types.ResponseData;
import uk.ac.ed.ph.jqtiplus.validation.ValidationContext;
import uk.ac.ed.ph.jqtiplus.value.NullValue;
import uk.ac.ed.ph.jqtiplus.value.Signature;
import uk.ac.ed.ph.jqtiplus.value.Value;

public final class GeometryDrawingInteraction extends CustomInteraction<GeometryDrawingExtensionPackage> {

    //private static final long serialVersionUID = 6364289440013765516L;
	private static final long serialVersionUID = 364289440013765516L;
	
	/** Name of this class in xml schema. */
    public static final String QTI_CLASS_NAME = "geometryDrawingInteraction";

    public GeometryDrawingInteraction(final QtiNode parent) {
        super(parent);
        
        getAttributes().add(new IntegerAttribute(this, GeometryDrawingConstants.ATTR_WIDTH_NAME, GeometryDrawingConstants.GEOMETRYDRAWING_NAMESPACE_URI, false));
        getAttributes().add(new IntegerAttribute(this, GeometryDrawingConstants.ATTR_HEIGHT_NAME, GeometryDrawingConstants.GEOMETRYDRAWING_NAMESPACE_URI, false));
        getAttributes().add(new StringAttribute(this, GeometryDrawingConstants.ATTR_BOUNDS_NAME, GeometryDrawingConstants.GEOMETRYDRAWING_NAMESPACE_URI, false));
        getAttributes().add(new BooleanAttribute(this, GeometryDrawingConstants.ATTR_GRID_NAME, GeometryDrawingConstants.GEOMETRYDRAWING_NAMESPACE_URI, true, false));
        getAttributes().add(new BooleanAttribute(this, GeometryDrawingConstants.ATTR_SNAPTO_NAME, GeometryDrawingConstants.GEOMETRYDRAWING_NAMESPACE_URI, true, false));
        getNodeGroups().add(new BlockGroup(this));
        getNodeGroups().add(new ObjectGroup(this, false));
    }

    public Object getObject() {
    	Object object = getNodeGroups().getObjectGroup().getObject();
    	if (object == null) {
    		return null;
    	} else {
    		return getNodeGroups().getObjectGroup().getObject();
    	}
    }

    public void setObject(final Object object) {
        getNodeGroups().getObjectGroup().setObject(object);
    }


    @Override
    public void validateThis(final GeometryDrawingExtensionPackage jqtiExtensionPackage, final ValidationContext context, final ResponseDeclaration responseDeclaration) {
        if (responseDeclaration!=null) {
            context.checkSignature(this, responseDeclaration, Signature.SINGLE_FILE);
        }

        final Object object = getObject();
        if (object != null && object.getType() != null && !object.getType().startsWith("image/")) {
            context.fireValidationError(this, "Object child must have an image type");
        }
    }
    
    @Override
    protected Value parseResponse(final GeometryDrawingExtensionPackage geometryDrawingExtensionPackage, final ResponseDeclaration responseDeclaration, final ResponseData responseData)
            throws ResponseBindingException {
        Value responseValue;
        responseValue = NullValue.INSTANCE;
        return responseValue;
    }

    @Override
    protected boolean validateResponse(final GeometryDrawingExtensionPackage jqtiExtensionPackage, final InteractionBindingContext interactionBindingContext, final Value responseValue) {
        return true;
    }
}
