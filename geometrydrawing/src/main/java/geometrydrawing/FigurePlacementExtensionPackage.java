package src.main.java.geometrydrawing;

import uk.ac.ed.ph.jqtiplus.ExtensionNamespaceInfo;
import uk.ac.ed.ph.jqtiplus.JqtiExtensionPackage;
import uk.ac.ed.ph.jqtiplus.JqtiLifecycleEventType;
import uk.ac.ed.ph.jqtiplus.internal.util.ObjectUtilities;
import uk.ac.ed.ph.jqtiplus.node.QtiNode;
import uk.ac.ed.ph.jqtiplus.node.expression.ExpressionParent;
import uk.ac.ed.ph.jqtiplus.node.expression.operator.CustomOperator;
import uk.ac.ed.ph.jqtiplus.node.item.interaction.CustomInteraction;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class FigurePlacementExtensionPackage implements JqtiExtensionPackage<FigurePlacementExtensionPackage> {

    public static final String DISPLAY_NAME = "FigurePlacement QTI Extension";
    private final Map<String, ExtensionNamespaceInfo> namespaceInfoMap;
    private final Set<String> customOperatorClasses;
	private final Set<String> customInteractionClasses;

    public FigurePlacementExtensionPackage() {
        final ExtensionNamespaceInfo extensionNamespaceInfo = new ExtensionNamespaceInfo(
                FigurePlacementConstants.FIGUREPLACEMENT_NAMESPACE_URI, FigurePlacementConstants.FIGUREPLACEMENT_SCHEMA_LOCATION,
                FigurePlacementConstants.FIGUREPLACEMENT_DEFAULT_NAMESPACE_PREFIX);
        final Map<String, ExtensionNamespaceInfo> namespaceInfoMapSource = new HashMap<String, ExtensionNamespaceInfo>();
        namespaceInfoMapSource.put(extensionNamespaceInfo.getNamespaceUri(), extensionNamespaceInfo);
        this.namespaceInfoMap = ObjectUtilities.unmodifiableMap(namespaceInfoMapSource);
        this.customOperatorClasses = Collections.unmodifiableSet(new HashSet<String>());
        this.customInteractionClasses = Collections.unmodifiableSet(new HashSet<String>(Arrays.asList(
                FigurePlacementConstants.FIGUREPLACEMENT_INTERACTION_CLASS
        )));
    }

    @Override
    public void lifecycleEvent(final Object source, final JqtiLifecycleEventType eventType) {
        return;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    @Override
    public Map<String, ExtensionNamespaceInfo> getNamespaceInfoMap() {
        return namespaceInfoMap;
    }

    @Override
    public boolean implementsCustomOperator(final String operatorClassName) {
        return customOperatorClasses.contains(operatorClassName);
    }

    @Override
    public boolean implementsCustomInteraction(final String interactionClassName) {
    	return customInteractionClasses.contains(interactionClassName);
    }

    @Override
    public CustomOperator<FigurePlacementExtensionPackage> createCustomOperator(final ExpressionParent expressionParent, final String operatorClassName) {
        return null;
    }

    @Override
    public CustomInteraction<FigurePlacementExtensionPackage> createCustomInteraction(final QtiNode parentObject, final String interactionClassName) {
    	if (FigurePlacementConstants.FIGUREPLACEMENT_INTERACTION_CLASS.equals(interactionClassName)) {
            return new FigurePlacementInteraction(parentObject);
        }
        return null;
    }
}

