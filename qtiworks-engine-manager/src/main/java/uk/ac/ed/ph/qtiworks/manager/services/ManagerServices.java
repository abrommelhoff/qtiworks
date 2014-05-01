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
package uk.ac.ed.ph.qtiworks.manager.services;

import uk.ac.ed.ph.qtiworks.config.beans.QtiWorksDeploymentSettings;
import uk.ac.ed.ph.qtiworks.domain.DomainConstants;
import uk.ac.ed.ph.qtiworks.domain.entities.LtiDomain;
import uk.ac.ed.ph.qtiworks.domain.entities.SystemUser;
import uk.ac.ed.ph.qtiworks.domain.entities.User;
import uk.ac.ed.ph.qtiworks.domain.entities.UserRole;
import uk.ac.ed.ph.qtiworks.services.AssessmentDataService;
import uk.ac.ed.ph.qtiworks.services.DataDeletionService;
import uk.ac.ed.ph.qtiworks.services.ServiceUtilities;
import uk.ac.ed.ph.qtiworks.services.dao.LtiDomainDao;
import uk.ac.ed.ph.qtiworks.services.dao.SystemUserDao;
import uk.ac.ed.ph.qtiworks.services.dao.UserDao;

import uk.ac.ed.ph.jqtiplus.internal.util.Assert;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Some useful (probably temporary) services used for bootstrapping the data model.
 *
 * @author David McKain
 */
@Service
@Transactional(readOnly=false, propagation=Propagation.REQUIRED)
public class ManagerServices {

    private static final Logger logger = LoggerFactory.getLogger(ManagerServices.class);

    public static final int LTI_SHARED_SECRET_MIN_LENGTH = 8;
	public static final String QTI_SAMPLE_OWNER_LOGIN_NAME = "qtisamples";
	public static final String QTI_SAMPLE_OWNER_FIRST_NAME = "QTI";
	public static final String QTI_SAMPLE_OWNER_LAST_NAME = "Samples";

    @Resource
    private QtiWorksDeploymentSettings qtiWorksDeploymentSettings;

    @Resource
    private DataDeletionService dataDeletionService;

    @Resource
    private AssessmentDataService assessmentDataService;

    @Resource
    private SystemUserDao systemUserDao;

    @Resource
    private UserDao userDao;

    @Resource
    private LtiDomainDao ltiDomainDao;

	//----------------------------------------------

    public SystemUser ensureInternalSystemUser(final UserRole userRole,
            final String loginName, final String firstName, final String lastName) {
        SystemUser result = systemUserDao.findByLoginName(loginName);
        if (result==null) {
            result = createSystemUser(userRole, loginName, firstName, lastName,
                    qtiWorksDeploymentSettings.getAdminEmailAddress(),
                    "(Login is disabled)", false, true);
            logger.info("Created internal system user {}", result);
        }
        return result;
    }

    /**
     * Creates a new {@link SystemUser} having the given details if there does not already exist an
     * {@link SystemUser} having the given <code>loginName</code>.
     *
     * @return newly created {@link SystemUser}, or null if a user already existed.
     */
    public SystemUser maybeCreateSystemUser(final UserRole userRole, final String loginName, final String firstName,
            final String lastName, final String emailAddress, final String password, final boolean sysAdmin) {
        final SystemUser result = createSystemUserIfRequired(userRole, loginName, firstName, lastName,
                emailAddress, password, sysAdmin, false);
        if (result!=null) {
            logger.info("Created system user {}", result);
        }
        return result;
    }

    private SystemUser createSystemUserIfRequired(final UserRole userRole, final String loginName, final String firstName,
            final String lastName, final String emailAddress, final String password,
            final boolean sysAdmin, final boolean loginDisabled) {
        final SystemUser result = systemUserDao.findByLoginName(loginName);
        if (result!=null) {
            /* User already exists */
            return null;
        }
        return createSystemUser(userRole, loginName, firstName, lastName, emailAddress, password, sysAdmin, loginDisabled);
    }

    private SystemUser createSystemUser(final UserRole userRole, final String loginName, final String firstName,
            final String lastName, final String emailAddress, final String password,
            final boolean sysAdmin, final boolean loginDisabled) {
        final String passwordSalt = ServiceUtilities.createSalt();
        final String passwordDigest = ServiceUtilities.computePasswordDigest(passwordSalt, password);
        final SystemUser result = new SystemUser(userRole);
        result.setLoginName(loginName);
        result.setFirstName(firstName);
        result.setLastName(lastName);
        result.setEmailAddress(emailAddress);
        result.setPasswordSalt(passwordSalt);
        result.setPasswordDigest(passwordDigest);
        result.setSysAdmin(sysAdmin);
        result.setLoginDisabled(loginDisabled);
        systemUserDao.persist(result);
        return result;
    }

    public boolean setSystemUserPassword(final String loginName, final String password) {
        final SystemUser user = systemUserDao.findByLoginName(loginName);
        if (user==null) {
            logger.warn("Could not find system user having loginName {}", loginName);
            return false;
        }
        final String passwordSalt = ServiceUtilities.createSalt();
        final String passwordDigest = ServiceUtilities.computePasswordDigest(passwordSalt, password);
        user.setPasswordSalt(passwordSalt);
        user.setPasswordDigest(passwordDigest);
        systemUserDao.update(user);
        return true;
    }

    public boolean updateSystemUser(final String loginName, final String firstName,
            final String lastName, final String emailAddress, final String password,
            final boolean sysAdmin, final boolean loginDisabled) {
        final SystemUser user = systemUserDao.findByLoginName(loginName);
        if (user==null) {
            logger.warn("Could not find system user having loginName {}", loginName);
            return false;
        }
        final String passwordSalt = ServiceUtilities.createSalt();
        final String passwordDigest = ServiceUtilities.computePasswordDigest(passwordSalt, password);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmailAddress(emailAddress);
        user.setPasswordSalt(passwordSalt);
        user.setPasswordDigest(passwordDigest);
        user.setSysAdmin(sysAdmin);
        user.setLoginDisabled(loginDisabled);
        systemUserDao.update(user);
        logger.info("Updated system user {}", user);
        return true;
    }

    //-------------------------------------------------

    public boolean findAndDeleteUser(final String loginNameOrUid) {
        final User user = findUserByLoginNameOrUid(loginNameOrUid);
        if (user==null) {
            logger.warn("Could not find user having loginName or ID {}", loginNameOrUid);
            return false;
        }
        logger.info("Deleting user {}", user);
        dataDeletionService.deleteUser(user);
        return true;
    }

    public boolean findAndResetUser(final String loginNameOrUid) {
        /* Try to look up by loginName first */
        final User user = findUserByLoginNameOrUid(loginNameOrUid);
        if (user==null) {
            logger.warn("Could not find user having loginName or ID {}", loginNameOrUid);
            return false;
        }
        logger.info("Resetting user {}", user);
        dataDeletionService.resetUser(user);
        return true;
    }

    private User findUserByLoginNameOrUid(final String loginNameOrUid) {
        /* Try to look up by loginName first */
        User user = systemUserDao.findByLoginName(loginNameOrUid);
        if (user==null) {
            /* Try by ID */
            try {
                final long uid = Long.parseLong(loginNameOrUid);
                user = userDao.findById(uid);
            }
            catch (final NumberFormatException e) {
                /* (Continue) */
            }
        }
        return user;
    }

    //-------------------------------------------------

    public boolean createOrUpdateLtiDomain(final String consumerKey, final String sharedSecret) {
        Assert.notNull(consumerKey, "consumerKey");
        Assert.notNull(sharedSecret, "consumerSecret");

        /* Validate key & secret */
        if (consumerKey.length() > DomainConstants.LTI_TOKEN_MAX_LENGTH) {
            logger.error("Consumer key {} must not be longer than {} characters", DomainConstants.LTI_TOKEN_MAX_LENGTH, consumerKey);
            return false;
        }
        if (!consumerKey.matches("[\\w-\\./]+")) {
            logger.error("Consumer key {} must contain only alphanumeric characters, '-', '/' and '.'", consumerKey);
            return false;
        }
        if (sharedSecret.length() < LTI_SHARED_SECRET_MIN_LENGTH || sharedSecret.length() > DomainConstants.LTI_SHARED_SECRET_MAX_LENGTH) {
            logger.error("Shared secret {} must be between {} and {} characters", new Object[] { sharedSecret, LTI_SHARED_SECRET_MIN_LENGTH, DomainConstants.LTI_TOKEN_MAX_LENGTH });
            return false;
        }
        if (!sharedSecret.matches("[\\w-\\.]+")) {
            logger.error("Shared secret {} must contain only alphanumeric characters, '-' and '.'", sharedSecret);
            return false;
        }

        /* Create/update LtiDomain entity as appropriate */
        LtiDomain ltiDomain = ltiDomainDao.findByConsumerKey(consumerKey);
        if (ltiDomain!=null) {
            /* Already registered - update secret if required */
            if (!sharedSecret.equals(ltiDomain.getConsumerSecret())) {
                ltiDomain.setConsumerSecret(sharedSecret);
                ltiDomainDao.update(ltiDomain);
                logger.info("Updated LTI domain data for consumer key {} and shared secret {}", consumerKey, sharedSecret);
            }
        }
        else {
            /* New domain */
            ltiDomain = new LtiDomain();
            ltiDomain.setConsumerKey(consumerKey);
            ltiDomain.setConsumerSecret(sharedSecret);
            ltiDomainDao.persist(ltiDomain);
            logger.info("Added new LTI domain for consumer key {} and shared secret {}", consumerKey, sharedSecret);
        }
        return true;
    }
}