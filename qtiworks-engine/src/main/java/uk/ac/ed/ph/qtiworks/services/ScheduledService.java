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
 * This software is derived from (and contains code from) QTItools and MathAssessEngine.
 * QTItools is (c) 2008, University of Southampton.
 * MathAssessEngine is (c) 2010, University of Edinburgh.
 */
package uk.ac.ed.ph.qtiworks.services;

import uk.ac.ed.ph.qtiworks.config.QtiWorksProfiles;
import uk.ac.ed.ph.qtiworks.domain.DomainConstants;

import uk.ac.ed.ph.jqtiplus.internal.util.Pair;

import java.util.Date;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Houses all scheduled tasks performed within the QTIWorks engine.
 * <p>
 * This is NO authorisation at this level.
 *
 * @author David McKain
 */
@Service
@EnableScheduling
@Profile({QtiWorksProfiles.WEBAPP, QtiWorksProfiles.MANAGER})
public class ScheduledService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledService.class);

    /** One second (in milliseconds) */
    public static final long ONE_SECOND = 1000L;

    /** One minute (in milliseconds) */
    private static final long ONE_MINUTE = ONE_SECOND * 60;

    /** One hour (in milliseconds) */
    private static final long ONE_HOUR = ONE_MINUTE * 60;

    /** How long (in milliseconds) to keep transient data */
    private static final long TRANSIENT_DATA_LIFETIME = 24 * ONE_HOUR;

    @Resource
    private DataDeletionService dataDeletionService;

    @Resource
    private LtiOutcomeService ltiOutcomeService;

    //-------------------------------------------------

    /** Routine maintenance jobs */
    @Scheduled(fixedRate=ONE_HOUR, initialDelay=ONE_MINUTE)
    public void maintenanceJobs() {
        purgeTransientData();
        purgeOldNonces();
        dataDeletionService.purgeOrphanedLtiCandidateUsers();
    }

    /**
     * Purges all anonymous users and transient deliveries that were created more than
     * {@link #TRANSIENT_DATA_LIFETIME} hours ago. All associated data is removed.
     */
    private void purgeTransientData() {
        logger.trace("purgeTransientData() invoked");

        final long beforeTimestamp = System.currentTimeMillis();
        final Date creationTimeThreshold = new Date(beforeTimestamp - TRANSIENT_DATA_LIFETIME);
        dataDeletionService.purgeTransientData(creationTimeThreshold);
        final long afterTimestamp = System.currentTimeMillis();
        final long duration = afterTimestamp - beforeTimestamp;

        logger.debug("pureTransientData() completed in {}ms", duration);
    }

    private void purgeOldNonces() {
        final Date nonceThreshold = new Date(System.currentTimeMillis() - DomainConstants.OAUTH_TIMESTAMP_MAX_AGE);
        dataDeletionService.purgeOldNonces(nonceThreshold);
    }

    //-------------------------------------------------

    /**
     * Attempts to send any queued LTI outcomes back to the relevant Tool Consumers.
     */
    @Scheduled(fixedDelay=10*ONE_SECOND, initialDelay=ONE_MINUTE)
    public void sendNextQueuedLtiOutcomes() {
        logger.trace("sendNextQueuedLtiOutcomes() invoked");

        final long beforeTimestamp = System.currentTimeMillis();
        final Pair<Integer, Integer> result = ltiOutcomeService.sendQueuedLtiOutcomes(false);
        final long afterTimestamp = System.currentTimeMillis();
        final long duration = afterTimestamp - beforeTimestamp;

        final int failureCount = result.getFirst().intValue();
        final int sendCount = result.getSecond().intValue();
        logger.debug("sendNextQueuedLtiOutcomes() completed in {}ms with {} failure(s) out of {} send(s)", duration,
                 failureCount, sendCount);
    }
}
