/* Copyright (c) 2012-2013, University of Edinburgh.
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
 * This software is derived from (and contains code from) QTITools and MathAssessEngine.
 * QTITools is (c) 2008, University of Southampton.
 * MathAssessEngine is (c) 2010, University of Edinburgh.
 */
package uk.ac.ed.ph.qtiworks.manager;

import uk.ac.ed.ph.qtiworks.domain.entities.LtiDomain;
import uk.ac.ed.ph.qtiworks.services.dao.LtiDomainDao;

import java.io.PrintWriter;
import java.util.List;

import org.springframework.context.ApplicationContext;

/**
 * Exports all LTI domain data
 *
 * @author David McKain
 */
public final class ExportLtiDomainsAction extends ManagerAction {

    @Override
    public String[] getActionSummary() {
        return new String[] {
        		"Outputs all registered LTI domain data to STDOUT in CSV format.",
        		"CSV format: consumerKey,sharedSecret"
        };
    }

    @Override
    public void run(final ApplicationContext applicationContext, final List<String> parameters) {
        final LtiDomainDao ltiDomainDao = applicationContext.getBean(LtiDomainDao.class);
        final List<LtiDomain> ltiDomains = ltiDomainDao.getAll();
        final PrintWriter printWriter = new PrintWriter(System.out);
        for (final LtiDomain ltiDomain : ltiDomains) {
            printWriter.write(ltiDomain.getConsumerKey());
            printWriter.write(',');
            printWriter.write(ltiDomain.getConsumerSecret());
            printWriter.println();
        }
        printWriter.close();
    }
}
