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
package uk.ac.ed.ph.jqtiplus.group.content.xhtml.table;

import uk.ac.ed.ph.jqtiplus.group.AbstractNodeGroup;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.table.TableCell;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.table.TableCellType;
import uk.ac.ed.ph.jqtiplus.node.content.xhtml.table.Tr;

import java.util.List;


/**
 * Group of tableCell children.
 *
 * @author Jonathon Hare
 */
public class TableCellGroup extends AbstractNodeGroup<TableCell> {

    private static final long serialVersionUID = 3647300480260318987L;

    /**
     * Constructs group.
     *
     * @param parent parent of created group
     */
    public TableCellGroup(final Tr parent) {
        super(parent, TableCell.DISPLAY_NAME, TableCellType.getQtiClassNames(), 1, null);
    }

    @Override
    public Tr getParent() {
        return (Tr) super.getParent();
    }

    @Override
    public boolean isGeneral() {
        return true;
    }

    /**
     * Gets list of all children.
     *
     * @return list of all children
     */
    public List<TableCell> getDlElements() {
        return getChildren();
    }

    /**
     * Creates child with given QTI class name.
     * <p>
     * Parameter classTag is needed only if group can contain children with different QTI class names.
     *
     * @param classTag QTI class name (this parameter is needed)
     * @return created child
     */
    @Override
    public TableCell create(final String classTag) {
        return TableCellType.getInstance(getParent(), classTag);
    }
}
