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
package uk.ac.ed.ph.qtiworks.web.controller.candidate;

import uk.ac.ed.ph.qtiworks.domain.entities.AssessmentPackage;
import uk.ac.ed.ph.qtiworks.domain.entities.CandidateSession;
import uk.ac.ed.ph.qtiworks.rendering.AbstractRenderingOptions;
import uk.ac.ed.ph.qtiworks.rendering.AuthorViewRenderingOptions;
import uk.ac.ed.ph.qtiworks.rendering.SerializationMethod;
import uk.ac.ed.ph.qtiworks.rendering.TestRenderingOptions;
import uk.ac.ed.ph.qtiworks.services.candidate.CandidateException;
import uk.ac.ed.ph.qtiworks.services.candidate.CandidateTestDeliveryService;
import uk.ac.ed.ph.qtiworks.web.ServletOutputStreamer;
import uk.ac.ed.ph.qtiworks.web.candidate.CandidateSessionContext;

import uk.ac.ed.ph.jqtiplus.node.result.AssessmentResult;
import uk.ac.ed.ph.jqtiplus.state.TestPlanNodeKey;
import uk.ac.ed.ph.jqtiplus.state.TestSessionState;
import uk.ac.ed.ph.jqtiplus.types.Identifier;
import uk.ac.ed.ph.jqtiplus.types.StringResponseData;

import java.io.IOException;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

/**
 * Controller for candidate test sessions
 *
 * @author David McKain
 */
@Controller
public class CandidateTestController extends CandidateControllerBase {

    @Resource
    private CandidateTestDeliveryService candidateTestDeliveryService;

    //----------------------------------------------------
    // Session containment and launching

    @RequestMapping(value="/testsession/{xid}/{xsrfToken}", method=RequestMethod.GET)
    public String driveSession(final HttpServletResponse response, final Model model, @PathVariable final long xid, @PathVariable final String xsrfToken) {
        response.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
        model.addAttribute("sessionEntryPath", "/candidate/testsession/" + xid + "/" + xsrfToken + "/enter");
        return "launch";
    }

    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/enter", method=RequestMethod.POST)
    public String enterSession(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.enterOrReenterCandidateSession(candidateSessionContext);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    //----------------------------------------------------
    // Rendering

    /**
     * Renders the current state of the given session
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/render", method=RequestMethod.GET)
    public void renderCurrentTestSessionState(@PathVariable final long xid, @PathVariable final String xsrfToken,
            final HttpServletResponse response)
            throws IOException, CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();

        /* Create appropriate options that link back to this controller */
        final String sessionBaseUrl = "/candidate/testsession/" + xid + "/" + xsrfToken;
        final TestRenderingOptions renderingOptions = new TestRenderingOptions();
        configureBaseRenderingOptions(sessionBaseUrl, renderingOptions);
        renderingOptions.setTestPartNavigationUrl(sessionBaseUrl + "/test-part-navigation");
        renderingOptions.setSelectTestItemUrl(sessionBaseUrl + "/select-item");
        renderingOptions.setAdvanceTestItemUrl(sessionBaseUrl + "/finish-item");
        renderingOptions.setReviewTestPartUrl(sessionBaseUrl + "/review-test-part");
        renderingOptions.setReviewTestItemUrl(sessionBaseUrl + "/review-item");
        renderingOptions.setShowTestItemSolutionUrl(sessionBaseUrl + "/item-solution");
        renderingOptions.setEndTestPartUrl(sessionBaseUrl + "/end-test-part");
        renderingOptions.setAdvanceTestPartUrl(sessionBaseUrl + "/advance-test-part");
        renderingOptions.setExitTestUrl(sessionBaseUrl + "/exit-test");

        final ServletOutputStreamer outputStreamer = new ServletOutputStreamer(response, null /* No caching */);
        candidateRenderingService.renderCurrentCandidateTestSessionState(candidateSessionContext, renderingOptions, outputStreamer);
    }

    /**
     * Renders the authoring view of the given session
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/author-view", method=RequestMethod.GET)
    public void renderCurrentItemAuthoringView(@PathVariable final long xid, @PathVariable final String xsrfToken,
            final HttpServletResponse response)
            throws IOException, CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();

        /* Create appropriate options that link back to this controller */
        final String sessionBaseUrl = "/candidate/testsession/" + xid + "/" + xsrfToken;
        final AuthorViewRenderingOptions renderingOptions = new AuthorViewRenderingOptions();
        configureBaseRenderingOptions(sessionBaseUrl, renderingOptions);

        final ServletOutputStreamer outputStreamer = new ServletOutputStreamer(response, null /* No caching */);
        candidateRenderingService.renderCurrentCandidateTestSessionStateAuthorView(candidateSessionContext, renderingOptions, outputStreamer);
    }

    private void configureBaseRenderingOptions(final String sessionBaseUrl, final AbstractRenderingOptions renderingOptions) {
        renderingOptions.setSerializationMethod(SerializationMethod.HTML5_MATHJAX);
        renderingOptions.setSourceUrl(sessionBaseUrl + "/source");
        renderingOptions.setStateUrl(sessionBaseUrl + "/state");
        renderingOptions.setResultUrl(sessionBaseUrl + "/result");
        renderingOptions.setValidationUrl(sessionBaseUrl + "/validation");
        renderingOptions.setServeFileUrl(sessionBaseUrl + "/file");
        renderingOptions.setAuthorViewUrl(sessionBaseUrl + "/author-view");
        renderingOptions.setResponseUrl(sessionBaseUrl + "/response");
    }

    //----------------------------------------------------
    // Response handling

    /**
     * Handles submission of candidate responses
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/response", method=RequestMethod.POST)
    public String handleResponses(final HttpServletRequest request, @PathVariable final long xid,
            @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();

        /* First need to extract responses */
        final Map<Identifier, StringResponseData> stringResponseMap = extractStringResponseData(request);

        /* Extract and import file responses (if appropriate) */
        Map<Identifier, MultipartFile> fileResponseMap = null;
        if (request instanceof MultipartHttpServletRequest) {
            fileResponseMap = extractFileResponseData((MultipartHttpServletRequest) request);
        }

        /* Extract comment (if appropriate) */
        final String candidateComment = extractCandidateComment(request);

        /* Call up service layer */
        candidateTestDeliveryService.handleResponses(candidateSessionContext, stringResponseMap, fileResponseMap, candidateComment);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    //----------------------------------------------------
    // Test navigation and lifecycle

    /**
     * @see CandidateTestDeliveryService#selectNavigationMenu(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/test-part-navigation", method=RequestMethod.POST)
    public String showNavigationMenu(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.selectNavigationMenu(candidateSessionContext);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#selectNonlinearItem(CandidateSessionContext, TestPlanNodeKey)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/select-item/{key}", method=RequestMethod.POST)
    public String selectNonlinearItem(@PathVariable final long xid, @PathVariable final String xsrfToken, @PathVariable final String key)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.selectNonlinearItem(candidateSessionContext, TestPlanNodeKey.fromString(key));

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#finishLinearItem(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/finish-item", method=RequestMethod.POST)
    public String finishLinearItem(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.finishLinearItem(candidateSessionContext);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#endCurrentTestPart(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/end-test-part", method=RequestMethod.POST)
    public String endCurrentTestPart(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.endCurrentTestPart(candidateSessionContext);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#reviewTestPart(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/review-test-part", method=RequestMethod.POST)
    public String reviewTestPart(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.reviewTestPart(candidateSessionContext);

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#reviewItem(CandidateSessionContext, TestPlanNodeKey)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/review-item/{key}", method=RequestMethod.POST)
    public String reviewItem(@PathVariable final long xid, @PathVariable final String xsrfToken, @PathVariable final String key)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.reviewItem(candidateSessionContext, TestPlanNodeKey.fromString(key));

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#requestSolution(CandidateSessionContext, TestPlanNodeKey)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/item-solution/{key}", method=RequestMethod.POST)
    public String showItemSolution(@PathVariable final long xid, @PathVariable final String xsrfToken, @PathVariable final String key)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.requestSolution(candidateSessionContext, TestPlanNodeKey.fromString(key));

        /* Redirect to rendering of current session state */
        return redirectToRenderSession(xid, xsrfToken);
    }

    /**
     * @see CandidateTestDeliveryService#advanceTestPart(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/advance-test-part", method=RequestMethod.POST)
    public String advanceTestPart(@PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        final CandidateSession candidateSession = candidateTestDeliveryService.advanceTestPart(candidateSessionContext);
        String redirect;
        if (candidateSession.isTerminated()) {
            /* We exited the test */
            redirect = redirectToExitUrl(candidateSessionContext, xsrfToken);
        }
        else {
            /* Moved onto next part */
            redirect = redirectToRenderSession(xid, xsrfToken);
        }
        return redirect;
    }

    /**
     * @see CandidateTestDeliveryService#exitTest(CandidateSessionContext)
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/exit-test", method=RequestMethod.POST)
    public String exitTest(@SuppressWarnings("unused") @PathVariable final long xid, @PathVariable final String xsrfToken)
            throws CandidateException {
        final CandidateSessionContext candidateSessionContext = getCandidateSessionContext();
        candidateTestDeliveryService.exitTest(candidateSessionContext);
        return redirectToExitUrl(candidateSessionContext, xsrfToken);
    }

    //----------------------------------------------------
    // Assessment resource streaming

    /**
     * Serves the given (white-listed) file in the given {@link AssessmentPackage}
     */
    @Override
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/file", method=RequestMethod.GET)
    public void streamAssessmentPackageFile(@PathVariable final long xid, @PathVariable final String xsrfToken,
            @RequestParam("href") final String fileHref,
            final HttpServletRequest request, final HttpServletResponse response)
            throws IOException, CandidateException {
        super.streamAssessmentPackageFile(xid, xsrfToken, fileHref, request, response);
    }

    //----------------------------------------------------
    // Author actions

    /**
     * Serves the source of the given {@link AssessmentPackage}
     */
    @Override
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/source", method=RequestMethod.GET)
    public void streamAssessmentSource(@PathVariable final long xid, @PathVariable final String xsrfToken,
            final HttpServletRequest request, final HttpServletResponse response)
            throws IOException, CandidateException {
        super.streamAssessmentSource(xid, xsrfToken, request, response);
    }

    /**
     * Streams an {@link TestSessionState} representing the current state of the given
     * {@link CandidateSession}
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/state", method=RequestMethod.GET)
    public void streamTestSessionState(@SuppressWarnings("unused") @PathVariable final long xid,
            @SuppressWarnings("unused") @PathVariable final String xsrfToken,
            final HttpServletResponse response)
            throws IOException, CandidateException {
        super.streamSessionState(response);
    }

    /**
     * Streams an {@link AssessmentResult} representing the current state of the given
     * {@link CandidateSession}
     */
    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/result", method=RequestMethod.GET)
    public void streamAssessmentResult(@SuppressWarnings("unused") @PathVariable final long xid,
            @SuppressWarnings("unused") @PathVariable final String xsrfToken,
            final HttpServletResponse response)
            throws IOException, CandidateException {
        super.streamAssessmentResult(response);
    }

    @RequestMapping(value="/testsession/{xid}/{xsrfToken}/validation", method=RequestMethod.GET)
    public String showPackageValidationResult(@SuppressWarnings("unused") @PathVariable final long xid,
            @SuppressWarnings("unused") @PathVariable final String xsrfToken,
            final Model model)
            throws CandidateException {
        return super.showPackageValidationResult(model);
    }

    //----------------------------------------------------
    // Redirections

    @Override
    protected String redirectToRenderSession(final long xid, final String xsrfToken) {
        return "redirect:/candidate/testsession/" + xid + "/" + xsrfToken + "/render";
    }
}
