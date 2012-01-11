/* Copyright (c) 2012, University of Edinburgh.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice, this
 *   list of conditions and the following disclaimer in the documentation and/or
 *   other materials provided with the distribution.
 *
 * * Neither the name of the University of Edinburgh nor the names of its
 *   contributors may be used to endorse or promote products derived from this
 *   software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * This software is derived from (and contains code from) QTItools and MathAssessEngine.
 * QTItools is (c) 2008, University of Southampton.
 * MathAssessEngine is (c) 2010, University of Edinburgh.
 */

package uk.ac.ed.ph.jqtiplus.utils;

import uk.ac.ed.ph.jqtiplus.xmlutils.XmlParseResult;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Encapsulates the results of attempting to read and parse a Content Packaging imsmanifest.xml
 * file, containing only details that are relevant to QTI.
 *
 * @author David McKain
 */
public final class ImsManifestReadResult implements Serializable {

    private static final long serialVersionUID = -4113064947715847310L;
    
    private final XmlParseResult xmlParseResult;
    private final String namespaceUri;
    private final List<CpResource> resourceList;
    private final Map<String, List<CpResource>> resourcesByTypeMap;
    
    public ImsManifestReadResult(final XmlParseResult xmlParseResult) {
        this.xmlParseResult = xmlParseResult;
        this.namespaceUri = null;
        this.resourceList = null;
        this.resourcesByTypeMap = null;
    }
    
    public ImsManifestReadResult(final XmlParseResult xmlParseResult, final String namespaceUri,
            final List<CpResource> resources) {
        this.xmlParseResult = xmlParseResult;
        this.namespaceUri = namespaceUri;
        this.resourceList = Collections.unmodifiableList(resources);
        
        Map<String, List<CpResource>> builder = new HashMap<String, List<CpResource>>();
        for (CpResource resource : resources) {
            List<CpResource> resourcesByType = builder.get(resource.getType());
            if (resourcesByType==null) {
                resourcesByType = new ArrayList<CpResource>();
                builder.put(resource.getType(), resourcesByType);
            }
            resourcesByType.add(resource);
        }
        this.resourcesByTypeMap = Collections.unmodifiableMap(builder);
    }
    
    public XmlParseResult getXmlParseResult() {
        return xmlParseResult;
    }
    
    public String getNamespaceUri() {
        return namespaceUri;
    }
    
    public List<CpResource> getResourceList() {
        return resourceList;
    }
    
    public Map<String, List<CpResource>> getResourcesByTypeMap() {
        return resourcesByTypeMap;
    }
    
    @Override
    public String toString() {
        return getClass().getSimpleName() + "@" + hashCode()
                + "(xmlParseResult=" + xmlParseResult
                + ",namespaceUri=" + namespaceUri
                + ",resourceList=" + resourceList
                + ",resourcesByTypeMap=" + resourcesByTypeMap
                + ")";
    }

}