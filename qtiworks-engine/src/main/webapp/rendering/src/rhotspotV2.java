/*
<LICENCE>

Copyright (c) 2008, University of Southampton
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
	list of conditions and the following disclaimer.

  *	Redistributions in binary form must reproduce the above copyright notice,
	this list of conditions and the following disclaimer in the documentation
	and/or other materials provided with the distribution.

  *	Neither the name of the University of Southampton nor the names of its
	contributors may be used to endorse or promote products derived from this
	software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

</LICENCE>
*/

import java.applet.Applet;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Event;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Image;
import java.awt.Point;
import java.awt.Rectangle;
import java.util.HashMap;
import java.util.Vector;

public class rhotspotV2 extends Applet
{

    public rhotspotV2()
    {
        border = 20;
        nopaint = -100;
        fontname = "TimesRoman";
        fontsize = 12;
    }

    void drawimagemarkeratpoint(final Graphics g, final Point point, final Image image, final Dimension dimension)
    {
        final Point point1 = new Point(point.x - dimension.width / 2, point.y - dimension.height / 2);
        g.drawImage(image, point1.x, point1.y, this);
    }

    public Vector getValues(final String name) {

    	final String s = readpoints(name);
    	final String[] points = s.split(":");

    	final Vector<String> values = new Vector<String>();

    	// fill vector with tokenized string content
    	for(int i=0; i<points.length; i++) {
    		values.add(points[i]);
    	}

    	return values;

    }

    public Vector getIdentifiers() {

    	final Vector<String> identifiers = new Vector<String>();

    	if(markerType.equals("LABELS")) {
    		final String interactions = getParameter("interactions");

    		final String[] tmpTokens = interactions.split("::");

    		// add tokenized interaction names to the vector
    		for(int i=0; i<tmpTokens.length; i++) {
    			identifiers.add(i, tmpTokens[i]);
    		}
    	}
    	else {
    		identifiers.add(0, getParameter("identifier"));
    	}

    	return identifiers;
    }

    String getNameOfTarget(final String name)
    {
        String returnString = "";
        String tempString = "";

        if(markerType.equals("LABELS")) {

        	// get maximum number of matches
        	final int matchMax = Integer.parseInt(getParameter("maxChoices:" + name));

     		final String[] theseIDs = (String[])markerIDs.get(name);
     		final Point[] theseLocations = (Point[])markerLocation.get(name);

     		// for each label in the current interaction...
     		for(int i=0; i<matchMax; i++) {

     			tempString = theseIDs[i];
     			final Point point = new Point(theseLocations[i].x, theseLocations[i].y);

     			for(int l=0; l<noOfTargets; l++) {

     				if(targetAreas[l].contains(point)) {
     					if(returnString.equals("")) {
     						if(tempString.equals(""))
     							returnString = targetNames[l];
     						else
     							returnString = tempString + " " + targetNames[l];
     					}
     					else {
     						returnString = returnString + ":" + tempString + " " + targetNames[l];
     					}
     				}
     			}
     		}
        }

        return returnString;

    }

    void identifymarkers()
    {
    	try {

    		// retrieve interaction names
	    	final String interactions = getParameter("interactions");
	    	intTokens = interactions.split("::");

	    	markerPicNames = new HashMap(intTokens.length);
            markerIDs = new HashMap(intTokens.length);
            markerTypes = new HashMap(intTokens.length);
            markermatchMaxs = new HashMap(intTokens.length);
            markerSizes = new HashMap(intTokens.length);
            markerPic = new HashMap(intTokens.length);
            markerLabels = new HashMap(intTokens.length);

            // for each interaction...
	    	for(int i=0; i<intTokens.length; i++) {

	    		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + intTokens[i]));

	    		// initialise current interaction's parameter arrays
	    		final String[] labels = new String[matchMax];
	            final String[] picNames = new String[matchMax];
	            final String[] iDs = new String[matchMax];
	            final String[] types = new String[matchMax];
	            final String[] matchMaxs = new String[matchMax];
	            final Dimension[] sizes = new Dimension[matchMax];
	            final Image[] pic = new Image[matchMax];

	            // for each label in the current interaction...
	            for(int j=0; j<matchMax; j++) {

	    			final String label = getParameter("labelNo" + (j+1) + ":" + intTokens[i]);
	    			labels[j] = label;
	    			final String[] labelTokens = label.split("::");

	    			// store tokenized label details in appropriate arrays
	    			iDs[j] = labelTokens[0];
	    			types[j] = labelTokens[1];
	    			picNames[j] = labelTokens[2];
	    			sizes[j] = new Dimension(Integer.parseInt(labelTokens[3]), Integer.parseInt(labelTokens[4]));
	    			matchMaxs[j] = labelTokens[5];

	    			if(labels[j].equals("Default")) {
	    				pic[j] = getImage(getCodeBase(), getParameter("markerName"));
	    			}
	    			else {
	    				final String picName = picNames[j];
	    				pic[j] = getImage(getCodeBase(), picName);
	    			}

	            }

	            // put the current interaction's arrays in the corresponding Hashmaps
	            markerPicNames.put(intTokens[i], picNames);
	            markerIDs.put(intTokens[i], iDs);
	            markerTypes.put(intTokens[i], types);
	            markermatchMaxs.put(intTokens[i], matchMaxs);
	            markerSizes.put(intTokens[i], sizes);
	            markerPic.put(intTokens[i], pic);
	            markerLabels.put(intTokens[i], labels);

	    	}
    	}

    	catch(final Exception _ex) {

    		bug = true;
            problem = problem + "Marker label Parameter missing or incorrect";

        }
    }

    @Override
    public void init()
    {
        bug = false;
        problem = "";
        offScreenImg = createImage(getSize().width, getSize().height);
        offScreenG = offScreenImg.getGraphics();
        noOfImages = Integer.parseInt(getParameter("NoOfMainimages"));
        Imagedetails = new String[noOfImages + 1];
        for(int i = 1; i < noOfImages + 1; i++)
        {
            final String s2 = "Mainimageno" + String.valueOf(i);
            final String s = getParameter(s2);
            Imagedetails[i] = getParameter(s2);
        }

        baseType = getParameter("baseType");
        markerType = getParameter("markerType");

        if(markerType.equals("STANDARD")) {
        	noOfMarkers = Integer.parseInt(getParameter("noOfMarkers"));
        	noOfTargets = Integer.parseInt(getParameter("noOfTargets"));
        	defaultMarkerPic = getImage(getCodeBase(), getParameter("markerName"));

        	feedbackInfo = getParameter("feedbackState");

        	try
            {
                targetrect = new Rectangle(0, 0);

                // in this case, an infinite number of markers should be used
                if(noOfMarkers == 0) {
                	markerLocationPoints = new Vector();
                	isInfinite = true;
                }

                // otherwise, the specified number of markers are used
                else {
                	markerLocations = new Point[noOfMarkers];
                	isInfinite = false;
                }

                startLine = getSize().height - border;

                // here, if noOfMarkers is zero, treat it as 1
                if(isInfinite)
                	space = getSize().width / 2;
                else
                	space = getSize().width / (1 + noOfMarkers);

                if(feedbackInfo.equals("No"))
                {
                    feedback = false;
                    initializemarkers();
                }
                else
                {
                	feedback = true;

                    if(isInfinite) {
                    	// add a single starting marker to the vector
                    	markerLocationPoints.add(new Point(nopaint, nopaint));
                    }
                    else {
                    	// add the appropriate number of markers to the array
                    	for(int l = 0; l < noOfMarkers; l++) {
                    		markerLocations[l] = new Point(nopaint, nopaint);
                    	}
                    }

                    settingstr = feedbackInfo.substring(feedbackInfo.indexOf(":") + 1);

                    if(isInfinite) {
                    	// extract the correct part of the feedback string
                    	if(settingstr.indexOf(":") < 0)
                    		valuestr = settingstr;
                        else
                        	valuestr = settingstr.substring(0, settingstr.indexOf(":"));

                        // retrieve and update the Point Object from the Vector
                    	final Point point = (Point)markerLocationPoints.elementAt(0);
                        point.setLocation(Integer.parseInt(valuestr.substring(0, valuestr.indexOf(" "))),
                        	Integer.parseInt(valuestr.substring(valuestr.indexOf(" ") + 1)));

                        // replace the Point held in the Vector
                        markerLocationPoints.setElementAt(point, 0);

                    }
                    else {
                    	for(int i1 = 0; i1 < noOfMarkers; i1++) {
    	                    boolean flag;

    	                    // if colons are present, separate the points on them
    	                    if(settingstr.indexOf(":") < 0) {

    	                        valuestr = settingstr;
    	                        flag = true;
    	                    }

    	                    else {

    	                        valuestr = settingstr.substring(0, settingstr.indexOf(":"));
    	                        flag = false;
    	                    }

    	                    // update marker locations and trim the colon-separated string
    	                    markerLocations[i1].x = Integer.parseInt(valuestr.substring(0, valuestr.indexOf(" ")));
    	                    markerLocations[i1].y = Integer.parseInt(valuestr.substring(valuestr.indexOf(" ") + 1));
    	                    settingstr = settingstr.substring(settingstr.indexOf(":") + 1);

    	                    if(flag)
    	                        break;
    	                }
                    }
                }
            }
            catch(final Exception _ex)
            {
                bug = true;
                problem = problem + "Feedback state Parameter missing or incorrect";
            }

        }

        if(markerType.equals("LABELS"))
        {
            // extract all of the marker information
        	identifymarkers();

        	try {

        		targetrect = new Rectangle(0, 0);
        		markerLocation = new HashMap(intTokens.length);

        		// for each interaction...
            	for(int t=0; t<intTokens.length; t++) {

            		// find the maximum number of matches
            		final String currentInt = intTokens[t];

            		feedbackInfo = getParameter("feedbackState:" + currentInt);
            		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + currentInt));

            		final Point[] locations = new Point[matchMax];

            		startLine = getSize().height - border;

    	            space = getSize().width / (1 + matchMax);

    	            if(feedbackInfo.equals("No"))

    	            {
    	                feedback = false;
    	                initializemarkers();
    	            }

    	            else
    	            {
    	            	feedback = true;
    	            	settingstr = feedbackInfo.substring(feedbackInfo.indexOf(":") + 1);

    	            	// for each label in the current interaction...
    	            	for(int m=0; m<matchMax; m++) {
    	            		locations[m] = new Point(nopaint, nopaint);

    	            		boolean flag;

		                    // if colons are present, separate the points on them
    	            		if(settingstr.indexOf(":") < 0) {
		                        valuestr = settingstr;
		                        flag = true;
		                    }

		                    else {
		                        valuestr = settingstr.substring(0, settingstr.indexOf(":"));
		                        flag = false;
		                    }

		                    // update the points in the location arrays
    	            		locations[m].x = Integer.parseInt(valuestr.substring(0, valuestr.indexOf(" ")));
		                    locations[m].y = Integer.parseInt(valuestr.substring(valuestr.indexOf(" ") + 1));

		                    settingstr = settingstr.substring(settingstr.indexOf(":") + 1);

		                    if(flag)
		                        break;
		                }

    	            	// replace the current interaction's location array in the HashMap
    	            	markerLocation.put(intTokens[t], locations);

    	            }

            	}

	        }

	        catch(final Exception _ex)
	        {
	            bug = true;
	            problem = problem + "Feedback state Parameter missing or incorrect";
	        }
        }
	    setBackground(Color.white);

    }

    void initializemarkers() {

    	if(isInfinite) {

    		// retrieve and update the Point Object from the Vector
        	final Point point = new Point();
            point.setLocation(space, startLine);

            // replace the Point held in the Vector
            markerLocationPoints.add(point);

        }

    	else {

    		if(markerType.equals("LABELS")) {

    			final String s = Imagedetails[1];
                final String[] tokens = s.split("::");
                borderLine = Integer.parseInt(tokens[4]);

                spacing = (getSize().height - borderLine) / intTokens.length;
                startLine = spacing/2;

    			// for each interaction...
            	for(int t=0; t<intTokens.length; t++) {

            		// find the maximum number of matches
            		final String currentInt = intTokens[t];
            		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + currentInt));

            		final Point[] theseLocations = new Point[matchMax];

            		space = getSize().width/(matchMax+1);

            		// arrange each label in the current interaction correctly
            		for(int m=0; m<matchMax; m++) {
            			int i;

            			if(matchMax > 5) {
            				if(m % 2 == 0)
            					i = startLine - 10;
            				else
            					i = startLine + 10;
            			}
            			else {
            				i = startLine;
            			}

            			// offset the label according to label/interaction row
            			theseLocations[m] = new Point(space * (m + 1), borderLine + i + (spacing * t));
            		}

            		markerLocation.put(intTokens[t], theseLocations);
            	}
            }

    		else {

    			for(int j = 0; j < noOfMarkers; j++) {
		            int i;

		            // set the marker's initial positions correctly
		            if(noOfMarkers > 5) {
		                if(j % 2 == 0)
		                    i = startLine - 10;
		                else
		                    i = startLine + 10;
		            }
		            else {
		                i = startLine;
		            }

		            markerLocations[j] = new Point(space * (j + 1), borderLine + i + spacing);
		        }
    		}
        }
    }

    @Override
    public boolean mouseDown(final Event event, final int i, final int j) {

        if(isInfinite) {

        	for(int k = 0; k < markerLocationPoints.size(); k++) {
        		final Point point = (Point)markerLocationPoints.elementAt(k);
        		final Dimension dimension = currentMarkerSize;
        		movetargettopoint(point, dimension, targetrect);
        		if(targetrect.contains(i, j)) {
        			pickedup = true;
        			currentIndex = k;
        			break;
        		}
        		pickedup = false;
        	}

        }

        else {

        	if(markerType.equals("LABELS")) {

    			// for each interaction...
            	for(int t=0; t<intTokens.length; t++) {

            		// find the maximum number of matches
            		final String currentInt = intTokens[t];
            		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + currentInt));

            		final Point[] theseLocations = (Point[])markerLocation.get(currentInt);

            		// check each label in the current interaction
            		for(int m=0; m<matchMax; m++) {

            			final Point point = theseLocations[m];
            			final Dimension dimension = currentMarkerSize;
            			movetargettopoint(point, dimension, targetrect);

            			// if the current mouse location is within a marker...
            			if(targetrect.contains(i, j)) {

            				// flag it and store its details
            				pickedup = true;
            				currentIndex = m;
            				currentInteraction = t;

            				break;
            			}

            			pickedup = false;
            		}

            		// break from the outer loop too if a marker is picked up
            		if(pickedup)
            			break;
            	}
        	}

        	else {

	        	for(int k = 0; k < noOfMarkers; k++) {

	        		final Point point = markerLocations[k];
		            final Dimension dimension = currentMarkerSize;
		            movetargettopoint(point, dimension, targetrect);
		            if(targetrect.contains(i, j))
		            {
		                pickedup = true;
		                currentIndex = k;
		                break;
		            }
		            pickedup = false;
		        }

        	}
        }

        return true;
    }

    @Override
    public boolean mouseDrag(final Event event, final int i, final int j)
    {
    	int k = i;
        int l = j;

        if(pickedup && !feedback)
        {
            // bring the marker back inside the applet if dragged outside
        	if(i > getSize().width)
                k = getSize().width - 5;
            if(i < 0)
                k = 5;
            if(j > getSize().height)
                l = getSize().height - 5;
            if(j < 0)
                l = 5;
            if(isInfinite) {
            	final Point point = new Point(k, l);
            	markerLocationPoints.set(currentIndex, point);
            }
            else {

            	// update the marker's position
            	if(markerType.equals("LABELS")) {

            		final Point[] locations = (Point[])markerLocation.get(intTokens[currentInteraction]);

            		locations[currentIndex].x = k;
            		locations[currentIndex].y = l;
            		markerLocation.put(intTokens[currentInteraction], locations);
            	}

            	else {
            		markerLocations[currentIndex].x = k;
            		markerLocations[currentIndex].y = l;

            	}
            }

            repaint();
        }

        return true;
    }

    @Override
    public boolean mouseUp(final Event event, final int i, final int j)
    {
        if(!feedback) {
        	Vector values;

        	// display the current interaction's coordinates in the status bar
        	if(markerType.equals("LABELS")) {
        		values = getValues(intTokens[currentInteraction]);
        		String tmp = (String)values.elementAt(0);
        		for(int k=1; k<values.size(); k++) {
        			tmp = tmp + ":" + (String)values.elementAt(k);
        		}
        		showStatus(tmp);
        	}
        	else if(markerType.equals("STANDARD")) {
        		values = getValues(null);
        		String tmp = (String)values.elementAt(0);
        		for(int k=1; k<values.size(); k++) {
        			tmp = tmp + ":" + (String)values.elementAt(k);
        		}
        		showStatus(tmp);
        	}

        }

        // move markers which are below the line to a sensible place
        if(markerType.equals("LABELS")) {
    		final Point[] locations = (Point[])markerLocation.get(intTokens[currentInteraction]);
    		if(locations[currentIndex].y > borderLine) {
	    		locations[currentIndex].y = borderLine + startLine + (spacing * currentInteraction);
    			markerLocation.put(intTokens[currentInteraction], locations);
        	}
    	}

    	else {
    		if(!isInfinite) {
    			if(markerLocations[currentIndex].y > borderLine)
    				markerLocations[currentIndex].y = startLine;
    		}
    	}


        // respawn a new point if using an infinite amount
        if(isInfinite) {
        	if(currentIndex == markerLocationPoints.size()-1) {
        		if(((Point)markerLocationPoints.elementAt(currentIndex)).y <= borderLine) {
        			final Point newPoint = new Point(space, startLine);
        			markerLocationPoints.add(newPoint);
        		}
        		// if the last point to be moved is below the line, just reset it
        		// instead of making a new marker
        		else {
        			((Point)markerLocationPoints.elementAt(currentIndex)).setLocation(space, startLine);
        		}
        	}
        	else {
        		if(((Point)markerLocationPoints.elementAt(currentIndex)).y > borderLine) {
        			final int oldX = ((Point)markerLocationPoints.elementAt(currentIndex)).x;
        			((Point)markerLocationPoints.elementAt(currentIndex)).setLocation(oldX, startLine);
        		}
        	}
        }
        repaint();
        return true;
    }

    void movetargettopoint(final Point point, final Dimension dimension, final Rectangle rectangle)
    {
        rectangle.setSize(dimension.width, dimension.height);
        final Point point1 = new Point(point.x - dimension.width / 2, point.y - dimension.height / 2);
        rectangle.setLocation(point1.x, point1.y);
    }

    @Override
    public void paint(final Graphics g)
    {
        try
        {
            offScreenG.setColor(getBackground());
            offScreenG.fillRect(0, 0, getSize().width, getSize().height);
            offScreenG.setColor(getForeground());
            final int i = getSize().width;
            final int j = getSize().height;
            for(int k1 = 1; k1 < noOfImages + 1; k1++)
            {
                final String s = Imagedetails[k1];

                final String[] tokens = s.split("::");

                final String s1 = tokens[0];
                final String s3 = tokens[1];
                final String s4 = tokens[2];
                final String s5 = tokens[3];
                final String s6 = tokens[4];

                borderLine = Integer.parseInt(s6);

                int k;
                if(s3.length() == 0)
                    k = 0;
                else
                    k = Integer.parseInt(s3);
                int l;
                if(s4.length() == 0)
                    l = 0;
                else
                    l = Integer.parseInt(s4);
                int i1;
                if(s5.length() == 0)
                    i1 = 0;
                else
                    i1 = Integer.parseInt(s5);
                int j1;
                if(s6.length() == 0)
                    j1 = 0;
                else
                    j1 = Integer.parseInt(s6);

                final Image image = getImage(getCodeBase(), s1);

                if(i1 == 0)
                    i1 = image.getWidth(this);
                if(j1 == 0)
                    j1 = image.getHeight(this);


                offScreenG.drawImage(image, k, l, i1, j1, this);
            }

            if(markerType.equals("STANDARD"))
            {
                currentMarkerSize = new Dimension(defaultMarkerPic.getWidth(this), defaultMarkerPic.getHeight(this));
                if(isInfinite) {
                	for(int l1 = 0; l1 < markerLocationPoints.size(); l1++)
                		drawimagemarkeratpoint(offScreenG, (Point)markerLocationPoints.elementAt(l1), defaultMarkerPic, currentMarkerSize);
                }
                else {
                    for(int l1 = 0; l1 < noOfMarkers; l1++)
	                    drawimagemarkeratpoint(offScreenG, markerLocations[l1], defaultMarkerPic, currentMarkerSize);
                }
            }
            if(markerType.equals("LABELS"))
            {
            	// for each interaction...
            	for(int t=0; t<intTokens.length; t++) {

            		// find the maximum number of matches
            		final String currentInt = intTokens[t];
            		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + currentInt));

            		final Image[] thesePics = (Image[])markerPic.get(currentInt);
            		final Point[] theseLocations = (Point[])markerLocation.get(currentInt);

            		// for each label in the current interaction...
            		for(int m=0; m<matchMax; m++) {
            			final Image thisPic = thesePics[m];

            			final Point thisLoc = theseLocations[m];

            			currentMarkerSize = new Dimension(thisPic.getWidth(this), thisPic.getHeight(this));

            			// draw the current marker at the appropriate point
            			drawimagemarkeratpoint(offScreenG, thisLoc, thisPic, currentMarkerSize);
            		}

            	}

            }

            if(markerType.equals("LABELS")) {

	            spacing = (getSize().height - borderLine) / intTokens.length;
	            startLine = spacing/2;

	            for(int c=0; c<intTokens.length; c++) {
	            	offScreenG.drawLine(0, borderLine+(spacing*c),
	            			getSize().width, borderLine+(spacing*c));
	            }
            }

            else if(markerType.equals("STANDARD")) {
            	offScreenG.drawLine(0, borderLine,
            			getSize().width, borderLine);
            }

            offScreenG.drawRect(0, 0, getSize().width - 1, getSize().height - 1);
            g.drawImage(offScreenImg, 0, 0, this);

        }

        catch(final Exception exception)
        {
            bug = true;
            problem = " Error in paint: probable missing parameters. " + exception.getMessage();
        }

        if(bug)
            showStatus(problem);
    }

    public void reSet()
    {
        initializemarkers();
        repaint();
    }

    String readpoints(final String name)
    {
        String returnString = "";

        if(markerType.equals("STANDARD")) {
	        if(isInfinite) {

	        	Point point = (Point)markerLocationPoints.elementAt(0);

	        	if(point.y <= borderLine)
	            	returnString = String.valueOf(point.x + " " + point.y);

	        	for(int i = 1; i < markerLocationPoints.size(); i++) {
	        		point = (Point)markerLocationPoints.elementAt(i);
	        		if(point.y <= borderLine)
	            		returnString = returnString + ":" + String.valueOf(point.x + " " + point.y);
	        	}

	        	// trim the leading colon if the first value is not to be returned
	    		if(((Point)markerLocationPoints.elementAt(0)).y > borderLine && returnString != "")
	    			returnString = returnString.substring(1);
	        }

	        else {

	        	Point point = markerLocations[0];

	        	if(point.y <= borderLine)
 	        		returnString = String.valueOf(point.x + " " + point.y);

	        	for(int i = 1; i < markerLocations.length; i++) {
	        		point = markerLocations[i];
 	        		if(point.y <= borderLine)
 	        			returnString = returnString + ":" + String.valueOf(point.x + " " + point.y);
	        	}

	        	// trim the leading colon if the first value is not to be returned
	    		if(markerLocations[0].y > borderLine && returnString != "")
	    			returnString = returnString.substring(1);
	        }
        }

        else {

        	// find the maximum number of matches
    		final String currentInt = name;
    		final int matchMax = Integer.parseInt(getParameter("maxChoices:" + currentInt));

    		final Point[] theseLocations = (Point[])markerLocation.get(currentInt);

    		if(theseLocations[0].y <= borderLine)
    			returnString = String.valueOf(theseLocations[0].x) + " " + String.valueOf(theseLocations[0].y);

    		// for each label in the current interaction...
    		for(int m=1; m<matchMax; m++) {
    			if(theseLocations[m].y <= borderLine)
    	    		returnString = returnString + ":" + String.valueOf(theseLocations[m].x) + " " + String.valueOf(theseLocations[m].y);
    		}

    		// trim the leading colon if the first value is not to be returned
    		if(theseLocations[0].y > borderLine && returnString != "")
    			returnString = returnString.substring(1);
        }

        return returnString;
    }

    @Override
    public void update(final Graphics g)
    {
        paint(g);
    }

    // instance variables

    // check for infinite number of points
    boolean isInfinite;

    // marker locations in finite select point interaction
    Point markerLocations[];

    // marker locations for position object interaction
    HashMap markerLocation;

    // marker locations for infinite select point interaction
    Vector markerLocationPoints;

    Rectangle targetrect;
    Rectangle targetAreas[];
    int noOfMarkers;
    int noOfTargets;
    int noOfImages;
    String Imagedetails[];
    String targetNames[];
    String markerTexts[];

    // used to store parameters in position object interaction
    HashMap markerLabels;
    HashMap markerPicNames;
    HashMap markerIDs;
    HashMap markerTypes;
    HashMap markermatchMaxs;
    HashMap markerSizes;
    HashMap markerPic;

    Dimension textMarkerSize;
    Dimension currentMarkerSize;
    Image defaultMarkerPic;

    // names of interactions in position object interactions
    String intTokens[];

    String testImage;
    Image mainPic[];
    Image offScreenImg;
    Graphics offScreenG;
    String problem;
    boolean bug;
    String feedbackInfo;
    String baseType;
    String markerType;
    String settingstr;
    String valuestr;
    boolean feedback;
    boolean pickedup;
    boolean targetsIdentified;

    // data about currently-selected object
    int currentInteraction;
    int currentIndex;

    int startLine;
    int border;
    int borderLine;
    int spacing;
    int space;
    int nopaint;
    Font f;
    String fontname;
    int fontsize;
    int strlen;
    int fontht;
    int fontdesc;
    int fontasc;
    FontMetrics fmetrics;

}