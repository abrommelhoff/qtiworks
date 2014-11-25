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
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Composite;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.MediaTracker;
import java.awt.Point;
import java.awt.Polygon;
import java.awt.Rectangle;
import java.awt.Shape;
import java.awt.event.MouseEvent;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.util.Iterator;
import java.util.StringTokenizer;
import java.util.Vector;

import javax.swing.event.MouseInputListener;

/*
 * The BoundedGraphicalApplet is suitable for use with associationInteraction, graphicalAssociationInteraction,
 * hotspotInteraction, graphicalOrderInteraction and graphicalGapMatchInteraction, accomodating each of these 5
 * types by containing slightly different operation code for each of the interaction types.
 *
 * However the basic premise of the applet stays the same; there is a canvas or background upon which all the
 * elements are displayed, on this background are a series of static 'hotspots' either textual or graphical and
 * finally for graphicalGapMatch and graphicalOrder there are a series of 'movable' items that can be assigned to
 * hotspots.
 *
 * for the two association types (graphical and textual) the associations are modelled as physical objects encapsulated
 * as the 'Association' local class
 *
 **/

public class BoundedGraphicalApplet extends Applet implements MouseInputListener
{
	/*
	 * borrowed code for drawing an arrow head, all credit to the java forum poster
	 * who openly donated this code.
	 */
	public static void drawArrow(final Graphics2D g2d, final int xCenter, final int yCenter, final int x, final int y, final float stroke)
	{
	      final double aDir=Math.atan2(xCenter-x,yCenter-y);
	      g2d.drawLine(x,y,xCenter,yCenter);
	      g2d.setStroke(new BasicStroke(1f));					// make the arrow head solid even if dash pattern has been specified
	      final Polygon tmpPoly=new Polygon();
	      final int i1=12+(int)(stroke*2);
	      final int i2=6+(int)stroke;							// make the arrow head the same size regardless of the length length
	      tmpPoly.addPoint(x,y);							// arrow tip
	      tmpPoly.addPoint(x+xCor(i1,aDir+.5),y+yCor(i1,aDir+.5));
	      tmpPoly.addPoint(x+xCor(i2,aDir),y+yCor(i2,aDir));
	      tmpPoly.addPoint(x+xCor(i1,aDir-.5),y+yCor(i1,aDir-.5));
	      tmpPoly.addPoint(x,y);							// arrow tip
	      g2d.drawPolygon(tmpPoly);
	      g2d.fillPolygon(tmpPoly);						// remove this line to leave arrow head unpainted
   }

    //additional helper functions for the above 'drawArrow' method
	private static int yCor(final int len, final double dir) {return (int)(len * Math.cos(dir));}
    private static int xCor(final int len, final double dir) {return (int)(len * Math.sin(dir));}



	/*
	 * The Association class holds either a directional or an undirected connection and ability
	 * to visualise a user made association between two different hotspot type objects.
	 */
	class Association
	{
		private final BoundObject A;
		private final BoundObject B;
		private final Point a;
		private final Point b;

		//basic accessor methods
		public BoundObject getA() {return A;}
		public BoundObject getB() {return B;}

		//simple assignment constructor
		Association(final BoundObject A, final BoundObject B, final Point a, final Point b)
		{
			this.A = A;
			this.B = B;
			this.a = a;
			this.b = b;
		}

		//self drawing method
		public void render(final Graphics g)
		{
			g.setColor(Color.DARK_GRAY);
			g.drawLine(a.x, a.y, b.x, b.y);

			final Graphics2D g2 = (Graphics2D)g;
			if(retType.equals("pair"))
        	{
        		drawArrow(g2, b.x, b.y, a.x,a.y, 1);
        		//offG.fillOval(rPoint.x-5, rPoint.y-5, 9, 9);
        	}
        	drawArrow(g2, a.x, a.y, b.x, b.y, 1);
		}
	}

	/*
	 * the BoundObject class is the realisation of the hotspot element, it is also the base
	 * class for the MovableObject class that realises both Ordering numeric data and gapImg
	 * moving object types
	 */
	class BoundObject
	{

		protected String keyCode;
		protected int value;

		protected Object label;
		protected String shape;
		protected String hotSpotLabel;
		protected int[] coords;
		protected Shape obj;

		protected int maxAssociations;
		protected int assCount;


		protected boolean highlighted;
		protected HashMap<String,Boolean> associatable = null;
		protected HashMap<String,Boolean> bound = null;

		public boolean isHighlighted() {return highlighted;}

		//default constructor necessary for the lightCopy method in the derived class 'MovableObject'
		BoundObject(){}

		BoundObject(final String keyCode,final Object label,final String shape,final int[] coords,final HashMap<String,Boolean> legitimateLinks, final String hotSpotLabel, final int maxAssociations)
		{
			this.keyCode = keyCode;
			this.label = label;
			this.shape = shape;
			this.coords = coords;
			this.hotSpotLabel = hotSpotLabel;
			this.associatable = legitimateLinks;

			this.maxAssociations = maxAssociations;
			this.assCount = 0;

			this.bound = new HashMap<String,Boolean>();

			//create an appropriate shape type object, based on provided geometry and type data
			if(shape.equals("rect"))
			{
				obj = new Rectangle(coords[0]-3,coords[1]-3,coords[2]+6,coords[3]+6);
				System.out.println("Object is rectangle.");
			}
			if(shape.equals("circle"))
			{
				obj = new Ellipse2D.Double((coords[0]-coords[2])-4,(coords[1]-coords[2])-4,(coords[2]+2)*2,(coords[2]+2)*2);
				System.out.println("Object is circle.");
			}
			if(shape.equals("ellipse"))
			{
				obj = new Ellipse2D.Double((coords[0]-coords[2])-4,(coords[1]-coords[2])-4,(coords[2]+2)*2,(coords[3]+2)*2);
				System.out.println("Object is eclipse.");
			}
			if(shape.equals("poly"))
			{
				final int xArr[] = new int[coords.length/2];
				final int yArr[] = new int[coords.length/2];
				int xCount = 0;
				int yCount = 0;
				for(int i=0; i < coords.length; i++)
				{
					if((i%2) == 0)
					{
						xArr[xCount] = coords[i];
						xCount++;
					}else
					{
						yArr[yCount] = coords[i];
						yCount++;
					}
				}

				//TODO calculate the centre of mass

				obj = new Polygon(xArr,yArr,xArr.length);
				System.out.println("Object is poly.");
			}
		}

		/*
		 * checks to see if the provided key is associable with this object
		 * if the hotspot has a limited (defined) matchGroup
		 */
		public boolean isAssociatable(final String keyCode)
		{
			if(associatable == null)
				return true;
			if(associatable.get(keyCode) != null)
				return true;
			return false;
		}

		public String getKeyCode() {return keyCode;}

		private double dist(final Point a, final Point b)
		{
			return Math.sqrt(((a.x-b.x)*(a.x-b.x))+((a.y-b.y)*(a.y-b.y)));
		}

		/*
		 * function designed for finding the correct point on the geom defined boundary
		 * with reference to the center point of another object or a given arbitrary point
		 *
		 * NOTE: not an essential function, however does provide nice looking association
		 * visualisations for circle and rectangle type geom's, note POLY and ELLIPSE are not
		 * properly implemented and simply return the centrepoint of the geom.
		 */
		public Point getPoint(final Point otherPoint)
		{

			//to get the edge point on the shape
			if(shape.equals("poly") || shape.equals("ellipse"))
				return getCentrePoint();

			final Point cp = getCentrePoint();
			final int rise = otherPoint.y-cp.y;
			final int run = otherPoint.x-cp.x;

			if(shape.equals("rect"))
			{
				if(rise == 0)
				{
					if(otherPoint.x >= cp.x)
						return new Point(coords[0]+coords[2]+4,coords[1]+(coords[3]/2));
					return new Point(coords[0]-2,coords[1]+(coords[3]/2));
				}
				else if(run == 0)
				{
					if(otherPoint.y >= cp.y)
						return new Point(coords[0]+(coords[2]/2),coords[1]+coords[3]+4);
					return new Point(coords[0]+(coords[2]/2),coords[1]-2);
				}else
				{

					final double m = (double)rise / (double)run;
					final double mx = (double)run / (double)rise;

					if(otherPoint.x >= cp.x && otherPoint.y >= cp.y)
					{
						final int yPoint = (int)(m*(coords[2]/2))+cp.y;
						final Point yInter = new Point(coords[0]+coords[2]+4,yPoint);

						final int xPoint = (int)(mx*(coords[3]/2))+cp.x;
						final Point xInter = new Point(xPoint,coords[1]+coords[3]+4);

						if(dist(xInter,cp) < dist(yInter,cp))
							return xInter;
						else
							return yInter;

					}else if(otherPoint.x < cp.x && otherPoint.y >= cp.y)
					{
						final int yPoint = (int)(-1*m*(coords[2]/2))+cp.y;
						final Point yInter = new Point(coords[0]-2,yPoint);

						final int xPoint = (int)(1*mx*(coords[3]/2))+cp.x;
						final Point xInter = new Point(xPoint,coords[1]+coords[3]+4);

						if(dist(xInter,cp) < dist(yInter,cp))
							return xInter;
						else
							return yInter;
					}else if(otherPoint.x < cp.x)
					{
						final int yPoint = (int)(-1*m*(coords[2]/2))+cp.y;
						final Point yInter = new Point(coords[0]-2,yPoint);

						final int xPoint = (int)(-1*mx*(coords[3]/2))+cp.x;
						final Point xInter = new Point(xPoint,coords[1]-2);

						if(dist(xInter,cp) < dist(yInter,cp))
							return xInter;
						else
							return yInter;
					}else
					{
						final int yPoint = (int)(m*(coords[2]/2))+cp.y;
						final Point yInter = new Point(coords[0]+coords[2]+4,yPoint);

						final int xPoint = (int)(-1*mx*(coords[3]/2))+cp.x;
						final Point xInter = new Point(xPoint,coords[1]-2);

						if(dist(xInter,cp) < dist(yInter,cp))
							return xInter;
						else
							return yInter;
					}

				}
			}else if(shape.equals("circle"))
			{
				if(rise != 0 && run != 0)
				{
					final double ratio = (coords[2] / Math.sqrt(rise*rise+run*run));

					return new Point(cp.x+(int)(run*ratio),cp.y+(int)(rise*ratio));
				}else
				{
					if(rise == 0)
					{
						if(run > 0)
							return new Point(cp.x+coords[2],cp.y);
						else
							return new Point(cp.x-coords[2],cp.y);
					}else
					{
						if(rise > 0)
							return new Point(cp.x,cp.y+coords[2]);
						else
							return new Point(cp.x,cp.y-coords[2]);
					}
				}
			}
			return null;
			//return cp;
		}


		/*
		 * calculates the exact centre point of the object given its geometric properties
		 */
		public Point getCentrePoint()
		{
			if(shape.equals("circle") || shape.equals("ellipse"))
				return new Point((int)((Ellipse2D)obj).getCenterX(),(int)((Ellipse2D)obj).getCenterY());
			if(shape.equals("poly"))
			{
				int xtot = 0;
				int ytot = 0;
				for(int i=0; i < coords.length; i++)
				{
					if((i % 2) == 0)
						xtot += coords[i];
					else
						ytot += coords[i];
				}
				return new Point((xtot*2)/coords.length,(ytot*2)/coords.length);
			}else
			{
				return new Point((int)((Rectangle)obj).getCenterX(),(int)((Rectangle)obj).getCenterY());
			}
		}


		/*
		 * simply determines if a provided point lies within the boundedObjects geometric realisation.
		 */
		public boolean inside(final Point p)
		{
			if(obj.contains(p))
				return true;
			return false;
		}


		/*
		 * the render method draws the object and highlights if the boundedObject's highlight property
		 * is set
		 */
		public void render(final Graphics2D g)
		{
			//draw label
			if(label instanceof String)
			{
				g.setColor(Color.BLACK);
				if(!((String)label).equals(""))
				{
					g.drawString((String)label, coords[0], coords[1]+(coords[3]));

					if(obj instanceof Polygon)
					{
						g.drawPolygon((Polygon)obj);
					}
					if(obj instanceof Ellipse2D)
					{
						final Ellipse2D e = (Ellipse2D)obj;
						g.drawOval((int)(e.getCenterX()-e.getWidth()/2), (int)(e.getCenterY()-e.getHeight()/2), (int)e.getWidth(), (int)e.getHeight());
					}else
					{
						final Rectangle r = (Rectangle)obj;
						g.drawRect(r.x, r.y, r.width, r.height);
					}
				}
			}else
			{
				final Rectangle enclose = obj.getBounds();

				g.drawImage((Image)label, coords[0]-(enclose.width/2), coords[1]-(enclose.height/2), null);
			}

			//draw highlight by shape
			if(highlighted)
			{
				g.setColor(Color.RED);
				g.setStroke(new BasicStroke(2));
				if(obj instanceof Polygon)
				{
					g.drawPolygon((Polygon)obj);
				}
				else if(obj instanceof Ellipse2D)
				{
					final Ellipse2D e = (Ellipse2D)obj;
					g.drawOval((int)(e.getCenterX()-e.getWidth()/2), (int)(e.getCenterY()-e.getHeight()/2), (int)e.getWidth(), (int)e.getHeight());
				}else
				{
					final Rectangle r = (Rectangle)obj;
					g.drawRect(r.x, r.y, r.width, r.height);
				}
				g.setStroke(new BasicStroke(1));
				g.setColor(Color.BLACK);
			}
		}

		public void setHighlighted(final boolean value)
		{
			this.highlighted = value;
		}
	}

	/*
	 * the MovableObject extends the BoundObject, with only a limited amount of functional overide.
	 * The main difference provided is for the object to be relocated by the user in a smooth manner,
	 * rather than simply being a static, highlightable object (hotspot) as the base BoundObject class
	 * describes.
	 *
	 * The MovableObject also provides a lightClone method, allowing for a budded child to share crucial
	 * items such as the associatable hashtable as the lightClone is still essentially the same object, but
	 * just an extension into multiple or ordered cardinality.
	 */
	class MovableObject extends BoundObject
	{
		Point startPos;
		Point pos;

		public void setStartPos(final Point startPos)
		{
			this.startPos = startPos;
			setPos(startPos);
			System.out.println("Just set a startPos! x: "+startPos.x+", y: "+startPos.y);
		}


		public void setPos(final Point pos)
		{
			this.pos = pos;
			updateShape(pos);
		}

		public void setPos2(final Point pos, final int yOffset)
		{
		    this.pos = pos;
		    this.pos.y += yOffset;
		    updateShape(pos);
		}

		public void resetPos()
		{
			setPos(this.startPos);
		}

		/*
		 * creates a copy of the object, sharing key properties with its parent. A deep copy is not
		 * needed, nor indeed desirable as copys of the original object simply represent the original
		 * objects assignment in multiple cardinality form
		 */
		public MovableObject lightClone()
		{
			final MovableObject clone = new MovableObject();
			clone.assCount = this.assCount;
			clone.associatable = this.associatable;
			clone.bound = this.bound;
			clone.coords = new int[this.coords.length];
			for(int i=0; i < this.coords.length; i++)
				clone.coords[i] = this.coords[i];
			clone.highlighted = this.highlighted;
			clone.hotSpotLabel = this.hotSpotLabel;
			clone.keyCode = this.keyCode;
			clone.label = this.label;
			clone.maxAssociations = this.maxAssociations;
			if(shape.equals("rect"))
			{
				clone.obj = new Rectangle(coords[0]-3,coords[1]-3,coords[2]+6,coords[3]+6);
			}
			if(shape.equals("circle"))
			{
				clone.obj = new Ellipse2D.Double((coords[0]-coords[2])-4,(coords[1]-coords[2])-4,(coords[2]+2)*2,(coords[2]+2)*2);
			}
			if(shape.equals("ellipse"))
			{
				clone.obj = new Ellipse2D.Double((coords[0]-coords[2])-4,(coords[1]-coords[2])-4,(coords[2]+2)*2,(coords[3]+2)*2);
			}
			if(shape.equals("poly"))
			{
				final int xArr[] = new int[coords.length/2];
				final int yArr[] = new int[coords.length/2];
				int xCount = 0;
				int yCount = 0;
				for(int i=0; i < coords.length; i++)
				{
					if((i%2) == 0)
					{
						xArr[xCount] = coords[i];
						xCount++;
					}else
					{
						yArr[yCount] = coords[i];
						yCount++;
					}
				}

				//TODO calculate the centre of mass

				clone.obj = new Polygon(xArr,yArr,xArr.length);
			}
			clone.pos = new Point(this.pos.x,this.pos.y);
			clone.shape = this.shape;
			clone.startPos = this.startPos;
			clone.value = this.value;

			return clone;
		}

		/*
		 * rebuilds the MovableObjects geometric definition from a new centre point using the original
		 * bounds co-ordinate data
		 */
		public void updateShape(final Point pos)
		{
			if(shape.equals("rect"))
			{
				obj = new Rectangle(pos.x-(coords[2]/2)-3,pos.y-(coords[3]/2)-3,coords[2]+3,coords[3]+3);
			}
			if(shape.equals("circle"))
			{
				obj = new Ellipse2D.Double(pos.x-(coords[2]/2)-4,pos.y-(coords[2]/2)-4,(coords[2]+2)*2,(coords[2]+2)*2);
			}
			if(shape.equals("ellipse"))
			{
				obj = new Ellipse2D.Double(pos.x-(coords[2]/2)-4,pos.y-(coords[3]/2)-4,(coords[2]+2)*2,(coords[3]+2)*2);
			}
			if(shape.equals("poly"))
			{
				final int xArr[] = new int[coords.length/2];
				final int yArr[] = new int[coords.length/2];
				int xCount = 0;
				int yCount = 0;
				for(int i=0; i < coords.length; i++)
				{
					if((i%2) == 0)
					{
						xArr[xCount] = coords[i];
						xCount++;
					}else
					{
						yArr[yCount] = coords[i];
						yCount++;
					}
				}

				//TODO calculate the centre of mass

				obj = new Polygon(xArr,yArr,xArr.length);
			}
		}

		/*
		 * @overide
		 * the overidden getCentrePoint method simply returns the last assigned point to this
		 * object instance
		 */
		@Override
        public Point getCentrePoint(){return pos;}

		/*
		 * @overide
		 * the overideen render simply does the drawing of the geom, as no highlighting or shape
		 * bounding is needed.
		 */
		@Override
        public void render(final Graphics2D g)
		{
			if(label instanceof String)
			{
				g.drawString((String)label, pos.x-(coords[2]), pos.y+(coords[3]/2));
			}else
			{
				final Rectangle enclose = obj.getBounds();

				g.drawImage((Image)label, pos.x-(enclose.width/2), pos.y-(enclose.height/2), null);
			}
		}

		public BufferedImage toBufferedImage(final Image img)
		{
		    if (img instanceof BufferedImage)
		    {
		        return (BufferedImage) img;
		    }

		    // Create a buffered image with transparency
		    final BufferedImage bimage = new BufferedImage(img.getWidth(null), img.getHeight(null), BufferedImage.TYPE_INT_ARGB);

		    // Draw the image on to the buffered image
		    final Graphics2D bGr = bimage.createGraphics();
		    bGr.drawImage(img, 0, 0, null);
		    bGr.dispose();

		    // Return the buffered image
		    return bimage;
		}

		public void render2(final Graphics2D g)
		{
		    if(label instanceof String)
            {
                g.drawString((String)label, pos.x-(coords[2]), pos.y+(coords[3]/2));
            }else
            {
                final Rectangle enclose = obj.getBounds();

                /*final BufferedImage alphaImg = toBufferedImage((Image)label);
                for (int a=0; a < alphaImg.getWidth(); a++) {
                    for (int b=0; b < alphaImg.getHeight(); b++) {
                        //System.out.println("The color is: "+alphaImg.getRGB(a, b));
                        if (alphaImg.getRGB(a, b) == 0xFFFFFF) {
                            final int rgb = (0 << 24) | (255 << 16) | (255 << 8) | 255;
                            alphaImg.setRGB(a, b, rgb);
                        }
                    }
                }
                g.drawImage(alphaImg, pos.x-(enclose.width/2), pos.y-(enclose.height/2), null);
                */
                g.drawImage((Image)label, pos.x, pos.y, null);
                //System.out.println("x: "+pos.x+", y: "+pos.y);
            }
		}

		MovableObject(){}

		MovableObject(final String keyCode,final Object label,final String shape,final int[] coords,final HashMap<String,Boolean> legitimateLinks, final String hotSpotLabel, final int maxAssociations)
		{
			super(keyCode,label,shape,coords,legitimateLinks,hotSpotLabel,maxAssociations);
		}
	}
    private int bottom;

	/*
	 * the reset method allows an external source, such as javascript in the html page in which the applet
	 * will be embedded, to clear all the user input and reset the applet to the state in which it was first
	 * presented to the user
	 */
	public void reset()
	{
		associations = new Vector<Association>();
		if(hotspots != null)
		{
			for(int i=0; i < hotspots.size(); i++)
			{
				hotspots.elementAt(i).bound = null;
				hotspots.elementAt(i).setHighlighted(false);
			}
		}

		if(movableObjects != null)
		{
			for(int i=0; i < movableObjects.size(); i++)
			{
				movableObjects.elementAt(i).resetPos();
				movableObjects.elementAt(i).bound = null;
			}
		}
		user_responses=0;
		mov = null;
		start = null;
		mpos = null;
		setFeedback();
		repaint();
	}

	/*
	 * removeLastAssocation can be remotely invoked in order to undo the last association
	 * assignment that the user has made.
	 */
	public void removeLastAssociation()
	{
		final Association a = associations.elementAt(associations.size()-1);
		a.B.assCount--;
		a.A.assCount--;
		associations.remove(associations.size()-1);
		user_responses--;
	}

	/*
	 * if the user has already answered the question / completed the interaction, feedback will
	 * be set in order to reconfigure the applet on re-presentation to the state that the user
	 * submitted for review. setting this feedback also adheres to the total interaction counts and
	 * populates local association counts, however does not re-police matchGroups and local association
	 * cap's
	 */
	public void setFeedback()
	{
		if(feedback == null || feedback.equals("")) {
		    System.out.println("");
		    return;
		}
		System.out.println("here in feedback!");
		final StringTokenizer st = new StringTokenizer(feedback,",");
		//switch dependants mode based on om string
		if(om.equals("graphic_associate_interaction"))
		{
			if(associations == null)
				associations = new Vector<Association>();

			while(st.hasMoreTokens())
			{
				//split the token again to get the two key codes
				final String[] parts = st.nextToken().split(" ");
				BoundObject start = null;
				BoundObject end = null;
				for(int i=0; i< hotspots.size(); i++)
				{
					if(hotspots.elementAt(i).keyCode.equals(parts[0]))
						start = hotspots.elementAt(i);
					if(hotspots.elementAt(i).keyCode.equals(parts[1]))
						end = hotspots.elementAt(i);
				}

				if(start != null && end != null)
				{
					start.assCount++;
					end.assCount++;
					associations.add(new Association(start,end,start.getPoint(end.getCentrePoint()),end.getPoint(start.getCentrePoint())));
				}
				user_responses++;
			}
		}else if(om.equals("hotspot_interaction"))
		{
			while(st.hasMoreTokens())
			{
				final String code = st.nextToken();
				for(int i=0; i < hotspots.size(); i++)
				{
					if(hotspots.elementAt(i).keyCode.equals(code))
						hotspots.elementAt(i).highlighted = true;
				}
				user_responses++;
			}
		}else if(om.equals("graphic_order_interaction"))
		{
			int index = 0;
			while(st.hasMoreTokens())
			{
				final String code = st.nextToken();
				BoundObject hotSpot = null;
				MovableObject movObj = null;
				for(int i=0; i<hotspots.size(); i++)
				{
					if(hotspots.elementAt(i).keyCode.equals(code))
						hotSpot = hotspots.elementAt(i);
				}

				movObj = movableObjects.elementAt(index);

				if(movObj != null && hotSpot != null)
				{
					movObj.bound.put(hotSpot.keyCode,new Boolean(true));
					movObj.assCount++;
					hotSpot.bound.put(movObj.keyCode,new Boolean(true));
					hotSpot.assCount++;
					movObj.setPos(hotSpot.getCentrePoint());
				}
				index++;
				user_responses++;
			}
		}else if(om.equals("gap_match_interaction"))
		{
			while(st.hasMoreTokens())
			{
				System.out.println("handling a token!");
				final String[] codepair = st.nextToken().split(" ");
				BoundObject hotSpot = null;
				MovableObject movObj = null;
				for(int i=0; i<hotspots.size(); i++)
				{
					if(hotspots.elementAt(i).keyCode.equals(codepair[1]))
						hotSpot = hotspots.elementAt(i);
				}

				for(int i=0; i < movableObjects.size(); i++)
				{
					if(movableObjects.elementAt(i).keyCode.equals(codepair[0]))
						movObj = movableObjects.elementAt(i);
				}

				if(movObj != null && hotSpot != null)
				{
					movObj.bound.put(hotSpot.keyCode,new Boolean(true));
					movObj.assCount++;
					hotSpot.bound.put(movObj.keyCode,new Boolean(true));
					hotSpot.assCount++;
					movObj.setPos(hotSpot.getCentrePoint());

					System.out.println("looking to clone...");
	 				final Integer size = movObjCount.get(movObj.keyCode);
	 				movObjCount.remove(movObj.keyCode);
	 				final int sz = size.intValue()+1;
	 				movObjCount.put(movObj.keyCode, new Integer(sz));
	 				final Integer maxSize = movObjMaxCount.get(movObj.keyCode);
	 				System.out.println("key variables are [current size] : "+sz+" and [maxSize] : "+maxSize.intValue());
	 				if(maxSize.intValue() == 0 || sz < maxSize.intValue())
	 				{
	 					final MovableObject copy = movObj.lightClone();
	 					copy.resetPos();
	 					movableObjects.add(copy);
	 				}

				}
				user_responses++;
			}
		} else if (om.equals("figure_placement_interaction")) {
		    while (st.hasMoreTokens()) {
		        final String[] codepair = st.nextToken().split(":");
		        final String[] coords = codepair[1].split(" ");
		        MovableObject movObj = null;
		        for(int i=0; i < movableObjects.size(); i++)
                {
		            System.out.println("keycode is: " + movableObjects.elementAt(i).getKeyCode() + " saved one is: " + codepair[0]);
                    if(movableObjects.elementAt(i).getKeyCode().equals(codepair[0])) {
                        movObj = movableObjects.elementAt(i);
                        break;
                    }
                }
		        if (movObj != null) {
		            movObj.setPos(new Point(Integer.parseInt(coords[0]), Integer.parseInt(coords[1])));
		        }
		    }
		}
	}

	/*
	 * externally callable method that returns the variable name(s) being manipulated and set within
	 * the applet, in this case it will always return a single element vector of the single variable
	 * identifier.
	 */
	public Vector<String> getIdentifiers()
	{
		final Vector<String> rets = new Vector<String>();
		rets.add(identifier);
		return rets;
	}

	/*
	 * externally callable method that returns the values set by the users interaction with the applet
	 * according to the interaction type the applet has been invoked with, return types are all vectors
	 * of strings, and more complex types such as points or pair types are unpacked into comma or space
	 * seperated strings accordingly.
	 */
	public Vector<String> getValues(final String _identifier)
	{
		if(!_identifier.equals(identifier))
			return null;
		final Vector<String> values = new Vector<String>();
		if(om.equals("hotspot_interaction"))
		{
			for(int i=0; i< hotspots.size(); i++)
				if(hotspots.elementAt(i).isHighlighted())
				{
					values.add(hotspots.elementAt(i).getKeyCode());
				}
		}else if(om.equals("graphic_associate_interaction"))
		{
			for(int i=0; i< associations.size(); i++)
			{
				String pair_add = "";
				pair_add += associations.elementAt(i).getA().getKeyCode();
				pair_add += " ";
				pair_add += associations.elementAt(i).getB().getKeyCode();
				values.add(pair_add);
			}
		}else if(om.equals("graphic_order_interaction"))
		{
			for(int i = 0; i < movableObjects.size(); i++)
			{
				final Iterator<String> vals = movableObjects.elementAt(i).bound.keySet().iterator();
				while(vals.hasNext()) {
					values.add(vals.next());
				}
			}
		}else if(om.equals("figure_placement_interaction"))
        {
            for(int i = 0; i < movableObjects.size(); i++)
            {
                //System.out.println("The point is: " + movableObjects.elementAt(i).pos.x + ", " + movableObjects.elementAt(i).pos.y);
                System.out.println("The movable Object thingy is: "+movableObjects.elementAt(i).getKeyCode()+" and bottom is: "+bottom);
                for (int q=0; q < hotspots.size(); q++) {
                    final Rectangle hsRect = new Rectangle(hotspots.elementAt(q).coords[0],hotspots.elementAt(q).coords[1],hotspots.elementAt(q).coords[2],hotspots.elementAt(q).coords[3]);
                    final Rectangle mvRect = new Rectangle(movableObjects.elementAt(i).pos.x, movableObjects.elementAt(i).pos.y, movableObjects.elementAt(i).obj.getBounds().width, movableObjects.elementAt(i).obj.getBounds().height);
                    System.out.println("The bounds for "+ hotspots.elementAt(q).getKeyCode() +" are: "+hsRect+ ". Is "+movableObjects.elementAt(i).getKeyCode() +" at: "+mvRect+" in there?");
                    //System.out.println("The bounds for "+ hotspots.elementAt(q).getKeyCode() +" are: "+hsRect+ ". Is "+movableObjects.elementAt(i).getKeyCode() +" at: "+movableObjects.elementAt(i).pos.x+","+movableObjects.elementAt(i).pos.y+" in there?");
                    //if (hotspots.elementAt(q).obj.contains(movableObjects.elementAt(i).obj.getBounds2D())) {
                    if (hsRect.contains(mvRect)) {
                        values.add(movableObjects.elementAt(i).getKeyCode()+":"+hotspots.elementAt(q).getKeyCode());
                    }
                }
                //values.add(movableObjects.elementAt(i).getKeyCode()+":"+movableObjects.elementAt(i).pos.x+", "+movableObjects.elementAt(i).pos.y);
            }
        }else if(om.equals("gap_match_interaction"))
		{
			for(int i=0; i< hotspots.size(); i++)
			{
				String pair_add = "";
				if(hotspots.elementAt(i).bound != null)
				{
					final Iterator<String> boundKeys = hotspots.elementAt(i).bound.keySet().iterator();
					while(boundKeys.hasNext())
					{
						pair_add += boundKeys.next();
						pair_add += " ";
						pair_add += hotspots.elementAt(i).getKeyCode();
						values.add(pair_add);
						pair_add = "";
						System.out.println("The pair we're adding is: "+pair_add);
					}
				}
			}
		}
		if (om.equals("figure_placement_interaction")) {
		    System.out.println("Got here! values is "+values.size());
		    for (final String element : values)
    		    System.out.println("Got here! values is " + element);
		}
		if (values.size() > 0) {
		    return values;
		} else {
		    values.add("");
		    return values;
		}
	}


	/*
	 * The init method reads from the properties to determine what mode the
	 * graphical applet is being run in, it then reads in further parameters
	 * defined by the hardcoded parameter retrieval and instantiates the visual
	 * objects accordingly
	 */
    @Override
    public void init()
    {

    	final int imCount = 0;
    	this.setLayout(null);
    	offScreenImg = createImage(getSize().width, getSize().height);
        offScreenG = offScreenImg.getGraphics();
    	final Graphics2D g2 = (Graphics2D)offScreenG;
        final FontRenderContext frc = g2.getFontRenderContext();
        associations = new Vector<Association>();
        final Font font = g2.getFont();
    	final MediaTracker m = new MediaTracker( this );

    	try
    	{
	    	//fetch parameters
	    	this.om = getParameter("operation_mode");
	    	final String bgImg = getParameter("background_image");
	    	final String hspotStr = getParameter("hotspot_count");
	    	final String movableElementStr = getParameter("movable_element_count");
	    	final String number_of_responses = getParameter("number_of_responses");
	    	retType = getParameter("baseType");
	    	identifier = getParameter("identifier");

	    	//load all non-null objects
	    	if(bgImg != null)
	    	{
	    		backGround = getImage(getCodeBase(), bgImg);
	    	}

	    	//load hotspots if there are any
	    	if(hspotStr != null)
	    	{

	    		final int hotSpotCount = Integer.parseInt(hspotStr);

	    		int dispLength = 0;

	    		for(int i=0; i<hotSpotCount; i++)
	    		{
	    			final String checkLength = getParameter("hotspot"+i);
	    			final String[] tokens  = checkLength.split("::");
	    			if(tokens.length >= 2)
	    			{
	    				if(!tokens[1].equals(""))
	    				{
	    					final Rectangle2D bounds = (new TextLayout(tokens[1],font,frc)).getBounds();
	    					if(dispLength < bounds.getWidth())
	    						dispLength = (int)bounds.getWidth();
	    				}
	    			}
	    		}


	    		final double radSeg = 2*Math.PI / hotSpotCount;
	    		final int cenX = this.getWidth() / 2;
	            final int cenY = this.getHeight() / 2;
	            System.out.println("dispLength : "+dispLength);
	            final double radius = (((this.getWidth() < this.getHeight())?this.getWidth():this.getHeight()) - (dispLength+10)) / 2.0;

	    		if(hotSpotCount > 0)
	    		{
	    			hotspots = new Vector<BoundObject>();
		    		for(int i=0; i<hotSpotCount; i++)
		    		{
		    			//generate the default point
		    			final double rOfset = radSeg * i;

		            	final int xPos = cenX+(int)(radius*Math.cos(rOfset));
		            	final int yPos = cenY+(int)(radius*Math.sin(rOfset));
		    			final Point defP = new Point(xPos,yPos);
		    			final BoundObject tmp = getBoundObjFromStr(getParameter("hotspot"+i), false, imCount, m,font,frc,defP);

		    			hotspots.add(tmp);
		    		}
	    		}

	    	}
	    	//load movable elements if there are any
	    	if(movableElementStr != null)
	    	{
	    		final int movCount = Integer.parseInt(movableElementStr);

	    		movObjCount = new HashMap<String,Integer>();
	    	    movObjMaxCount = new HashMap<String,Integer>();

	    		//work out horizontal spacing

	    		int space = this.getWidth() / movCount+1;

	    		if(movCount > 0)
	    		{
	    		    // pre-process movable objects' widths and heights
	    		    int maxHeight = 0;
	    		    int totalWidth = 0;
	    		    boolean twoRows = false;
	    		    for(int h=0; h<movCount; h++)
                    {
	    		        final MovableObject mov = (MovableObject)getBoundObjFromStr(getParameter("movable_object"+h), true, imCount, m,font,frc, new Point(0,0));
	    		        System.out.println("The width of this object is: "+mov.obj.getBounds().width);
	    		        totalWidth += mov.obj.getBounds().width;

	    		        System.out.println("IS "+mov.obj.getBounds().height+" GREATER THAN "+maxHeight);
	    		        if (maxHeight < mov.obj.getBounds().height) {
	    		            maxHeight = mov.obj.getBounds().height;
	    		            System.out.println("MAX HEIGHT IS NOW: "+maxHeight);
	    		        }
                    }

	    		    if (totalWidth > this.getWidth()) {
	    		        twoRows = true;
	    		        space = this.getWidth() / (movCount/2)+1;
	    		    }

	    		    if (twoRows) {
	    		        bottom = this.getHeight() - (maxHeight*2);
	    		    } else {
	    		        bottom = this.getHeight() - maxHeight;
	    		    }
	    			movableObjects = new Vector<MovableObject>();
		    		for(int i=0; i<movCount; i++)
		    		{
		    		    int j = i;
		    		    int heightOffset = 0;
		    			final MovableObject mo = (MovableObject)getBoundObjFromStr(getParameter("movable_object"+i), true, imCount, m,font,frc, new Point(0,0));

		    			// TODO: Fix the y-values, veer away from hard-coded values.
		    			if (twoRows && i >= movCount/2) {
		    			    j = j - (movCount/2);
		    			    heightOffset = maxHeight;
		    			} else if (twoRows && i < movCount/2) {
		    			    heightOffset = maxHeight * 2;
		    			} else {
		    			    heightOffset = 50;
		    			}
		    			final Point p = new Point((space/2)+(space*j),this.getHeight()-heightOffset);
		    			mo.setStartPos(p);
		    			movableObjects.add(mo);
		     		}
	    		}
	    	}

	    	//set configuration settings, if they are present
	    	if(number_of_responses != null)
	    	{
	    		this.number_of_responses = Integer.parseInt(number_of_responses);
	    	}


	    	//now check to see if there is any feedback, and using it appropriately if there is
	    	feedback = getParameter("feedback");
	    	setFeedback();
    	}catch(final Exception e)
    	{
    		e.printStackTrace();
    	}

         setBackground(Color.white);
         this.addMouseMotionListener(this);
         this.addMouseListener(this);
    }

    /*
     * sets highlighted and 'mouse-over' labels if present based
     * on mouse movement over the canvas area, note highlighting is
     * disabled for the hotspot interaction as highlighting is used
     * to represent selection in this mode
     */
    @Override
    public void mouseMoved(final MouseEvent me)
    {
    	if(!om.equals("hotspot_interaction") && !om.equals("figure_placement_interaction"))
    	{
	    	for(int i=hotspots.size()-1; i > -1; --i)
	    		if(hotspots.elementAt(i).inside(me.getPoint()))
	    			hotspots.elementAt(i).setHighlighted(true);
	    		else
	    			hotspots.elementAt(i).setHighlighted(false);
    	}

    	drawHSLabel = null;
    	if (!om.equals("figure_placement_interaction")) {
        	for(int i=hotspots.size()-1; i > -1; --i)
        		if(hotspots.elementAt(i).inside(me.getPoint()))
        			this.drawHSLabel = hotspots.elementAt(i);
    	}
    	mpos = me.getPoint();
    	repaint();
    }

    /*
     * when the mouse is dragged the canvas it updates the selected movable object or
     * association to the current point, besides continuing the task of highlighting
     * as in mouseMoved.
     */
    @Override
    public void mouseDragged(final MouseEvent me){

    	if(om.equals("graphic_associate_interaction") || om.equals("graphic_order_interaction") || om.equals("gap_match_interaction"))
    	{
	    	if(start != null || mov != null)
	    		mpos = me.getPoint();
	    	for(int i=hotspots.size()-1; i > -1; --i)
	     		if(hotspots.elementAt(i).inside(me.getPoint()))
	     			hotspots.elementAt(i).setHighlighted(true);
	    		else
	    			hotspots.elementAt(i).setHighlighted(false);
	    	repaint();
    	}
    	if(om.equals("graphic_order_interaction") || om.equals("gap_match_interaction") || om.equals("figure_placement_interaction"))
    	{
    		if(mov != null)
    		{
    			mov.setPos(me.getPoint());
    		}
    		if (om.equals("figure_placement_interaction")) {
    		    repaint();
    		}
    	}
    	drawHSLabel = null;
    }

    //unused function, stubbed due to interface forced implementation
    @Override
    public void mouseEntered(final MouseEvent event){}


    /*
     * the click method, only used for hotspot interaction, is used for selecting
     * (or deselecting an already selected) hotspot.
     */
    @Override
    public void mouseClicked(final MouseEvent event){
    	if(om.equals("hotspot_interaction"))
    	{
    		for(int i=hotspots.size()-1; i > -1; --i)
        		if(hotspots.elementAt(i).inside(event.getPoint()))
        		{
        			if(hotspots.elementAt(i).isHighlighted())
        			{
        				user_responses--;
        				hotspots.elementAt(i).setHighlighted(false);
        			}
        			else if (number_of_responses == -1 || number_of_responses > user_responses)
        			{
        				hotspots.elementAt(i).setHighlighted(true);
        				user_responses++;
        			}
        		}
    	}
    	repaint();
    }

    //unused function, stubbed due to interface forced implementation
    @Override
    public void mouseExited(final MouseEvent event){}

    /*
     * mousePressed function is used to signify the start of a drag action, and so determines
     * and sets the global movement / interaction variables accorting to the interaction (operation)
     * mode that the applet is running in.
     */
    @Override
    public void mousePressed(final MouseEvent event){
    	if(om.equals("graphic_associate_interaction"))
    	{
    		start = null;
	    	 for(int i=hotspots.size()-1; i > -1; --i)
		     		if(hotspots.elementAt(i).inside(event.getPoint()))
		     			start = hotspots.elementAt(i);
	    	if(start != null)
	    		mpos = event.getPoint();
	    	repaint();
    	}else if(om.equals("graphic_order_interaction") || om.equals("gap_match_interaction"))
    	{
    		mov = null;
    		for(int i=movableObjects.size()-1; i > -1; --i)
	     		if(movableObjects.elementAt(i).inside(event.getPoint()))
	     			mov = movableObjects.elementAt(i);
    		if(mov != null)
    		{
    			BoundObject remObj = null;
   	    	 	for(int i=hotspots.size()-1; i > -1; --i)
   		     		if(hotspots.elementAt(i).inside(event.getPoint()))
   		     			remObj = hotspots.elementAt(i);
   	    	 	if(remObj != null)
   	    	 	{
   	    	 		remObj.bound.remove(mov.keyCode);
   	    	 		remObj.assCount--;
   	    	 		mov.bound.remove(remObj.keyCode);
   	    	 	}
    		}

    		repaint();
    	} else { //figure_placement_interaction
    	    System.out.println("There are "+movableObjects.size()+ " movable objects");
    	    mov = null;
            for(int i=movableObjects.size()-1; i > -1; --i)
                if(movableObjects.elementAt(i).inside(event.getPoint()))
                    mov = movableObjects.elementAt(i);
    	    repaint();
    	}

    	if (om.equals("graphic_order_interaction")) {
    	    for (int g=0; g < hotspots.size(); g++) {
    	        final Graphics gr = this.getGraphics();
    	        gr.drawRect(hotspots.elementAt(g).coords[0],hotspots.elementAt(g).coords[1],hotspots.elementAt(g).coords[2],hotspots.elementAt(g).coords[3]);
    	    }
    	}
    }

    /*
     * the mouse released mode is used to update the actual state of the users interactions,
     * depending on the constrainst of the system and its operational mode. The only type
     * of interaction that isnt solidified through this method is that of hotspotInteraction,
     * which uses the click method instead as no dragging is ever required.
     */
    @Override
    public void mouseReleased(final MouseEvent event){

    	 if(om.equals("graphic_associate_interaction") && start != null)
    	 {
	    	 BoundObject end = null;
	    	 for(int i=hotspots.size()-1; i > -1; --i)
	     		if(hotspots.elementAt(i).inside(event.getPoint()))
	     			end = hotspots.elementAt(i);

	    	 if(end != null && !end.equals(start))
	    	 {
	    		 System.out.println("into the first check!");
	    		 if(start.isAssociatable(end.getKeyCode()))
	    		 {
	    			 System.out.println("is associable!");
	    			 if(number_of_responses == -1 || user_responses < number_of_responses)
	    			 {
	    				 System.out.println("has an acceptable number of responses!");
	    				 if((start.maxAssociations == 0 || (start.assCount < start.maxAssociations)) &&
	    						 (end.maxAssociations == 0 || (end.assCount < end.maxAssociations)))
	    				 {
	    					 System.out.println("passed the local limit checks!");
	    					 start.assCount++;
	    					 end.assCount++;
		    				 //checking to see if there is already an association of such value
	    					 Association repeat = null;
	    					 for(int i=0; i<associations.size(); i++)
	    					 {
	    						 final Association a = associations.elementAt(i);
	    						 if((a.getA().equals(start) && a.getB().equals(end)) ||
	    						    (a.getA().equals(end) && a.getB().equals(start)))
	    							 repeat = a;
	    					 }


		    				 if(repeat == null)
		    				 {
		    					 System.out.println("adding a new association!");
		    					 associations.add(new Association(start,end,start.getPoint(end.getCentrePoint()),end.getPoint(start.getCentrePoint())));
		    					 user_responses++;
		    				 }
	    				 }
	    			 }
	    		 }
	    	 }

	    	 start = null;
	         mpos = null;
	         repaint();
    	 }
    	 if(om.equals("graphic_order_interaction") || om.equals("gap_match_interaction"))
    	 {
    		 BoundObject end = null;
	    	 for(int i=hotspots.size()-1; i > -1; --i)
	     		if(hotspots.elementAt(i).inside(event.getPoint()))
	     			end = hotspots.elementAt(i);
	    	 if(end != null && (end.maxAssociations == 0 || (end.assCount < end.maxAssociations)))
	    	 {
    	 		 if(mov != null)
    	 		 {
    	 			 end.bound.put(mov.keyCode, new Boolean(true));
    	 			 end.assCount++;
    	 			 if(end.isAssociatable(mov.keyCode))
    	 			 {
    	 			     final int somesize = mov.obj.getBounds().height;
	    	 			 mov.bound.put(end.keyCode, new Boolean(true));
	    	 			 mov.setPos2(end.getCentrePoint(), somesize*(end.assCount-1));
	    	 			 if(om.equals("gap_match_interaction"))
	 					 {
	    	 				System.out.println("looking to clone...");
	    	 				final Integer size = movObjCount.get(mov.keyCode);
	    	 				movObjCount.remove(mov.keyCode);
	    	 				final int sz = size.intValue()+1;
	    	 				movObjCount.put(mov.keyCode, new Integer(sz));
	    	 				final Integer maxSize = movObjMaxCount.get(mov.keyCode);
	    	 				System.out.println("key variables are [current size] : "+sz+" and [maxSize] : "+maxSize.intValue());
	    	 				if(maxSize.intValue() == 0 || sz < maxSize.intValue())
	    	 				{
	    	 					final MovableObject copy = mov.lightClone();
	    	 					copy.resetPos();
	    	 					movableObjects.add(copy);
	    	 				}
	 					 }
    	 			 }
    	 		 }
	    	 }else
	    	 {
	    		 if(mov != null)
    	 		 {
	    			 mov.resetPos();
    	 		 }
	    	 }
	    	 mov = null;
	    	 repaint();
    	 }
    }

    /*
     * the main paint method for the applet draws to a buffer image (double buffering essentially for
     * smoother illustration), starting with a background image (if present) and then calls the render
     * methods for each of the associations, hotspots and movable objects present in the system, and then
     * finally if a label area is being hovered over displays the objects annotated lable (if the object
     * has one).
     */
    @Override
    public void paint(final Graphics g)
    {
        try
        {
            offScreenG.setColor(getBackground());
            offScreenG.fillRect(0, 0, getSize().width, getSize().height);

            if(offG == null)
            	offG = offScreenG.create();

            if(backGround != null)
            {
            	//System.out.println("drawing the loaded background image");
            	offG.drawImage(backGround, 0, 0, this);
            	final int h = backGround.getHeight(this);
            	final int w = backGround.getWidth(this);
            	offG.setColor(Color.BLACK);
            	//offG.drawRect(0, 0, w, h);
            }

            offScreenG.setColor(Color.BLACK);
            //offScreenG.drawRect(0, 0, this.getWidth()-1, this.getHeight()-1); //disable drawing of bounding box

            final Graphics2D g2 = (Graphics2D)offG;
			final Composite normC = g2.getComposite();
			g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_ATOP,(float)0.8));
            for(int i=0; i < associations.size(); i++)
            	associations.elementAt(i).render(offG);
            if(mpos != null && start != null)
            {
            	offG.setColor(Color.DARK_GRAY);
            	final Point rPoint = start.getPoint(mpos);
            	offG.drawLine(rPoint.x, rPoint.y, mpos.x, mpos.y);
            	if(retType.equals("pair"))
            	{
            		drawArrow(g2, mpos.x, mpos.y, rPoint.x, rPoint.y, 1);
            	}
            	drawArrow(g2, rPoint.x, rPoint.y, mpos.x, mpos.y, 1);
            }
			if(hotspots != null)
			{
				for(int i=0; i < hotspots.size(); i++)
					hotspots.elementAt(i).render(g2);
			}

			if(movableObjects != null)
			{
				for(int i=0; i < movableObjects.size(); i++)
				{
					movableObjects.elementAt(i).render2(g2);
				}
			}
            g2.setComposite(normC);
            if(drawHSLabel != null)
            {
            	if(drawHSLabel.hotSpotLabel != null && !drawHSLabel.hotSpotLabel.equals(""))
            	{

            		final Rectangle2D bounds = (new TextLayout(drawHSLabel.hotSpotLabel,g2.getFont(),g2.getFontRenderContext())).getBounds();
            		g2.setColor(Color.YELLOW);
            		g2.fillRect(mpos.x, mpos.y-((int)bounds.getHeight()+4), (int)bounds.getWidth()+10, (int)bounds.getHeight()+8);
            		g2.setColor(Color.BLACK);
            		g2.drawRect(mpos.x, mpos.y-((int)bounds.getHeight()+4), (int)bounds.getWidth()+10, (int)bounds.getHeight()+8);
            		g2.drawString(drawHSLabel.hotSpotLabel, mpos.x+5, mpos.y);
            	}
            }

            g.drawImage(offScreenImg, 0, 0, this);
        }
        catch(final Exception exception)
        {
        	exception.printStackTrace();
        }
    }

    @Override
    public void update(final Graphics g)
    {
        paint(g);
    }


    /*
     * The getBoundObjFromString method unpacks the hotspot / gapImg tyep objects brokered to the
     * applet from the param definitions provided in the wrapping HTML. The function unpacks parameters,
     * identifiers, annotations, limititations and image definitions, and loads and sets them into a
     * object constructor call for a boundObject or derived MovableObject, depending upon instantiation
     * instruction (boolean movable).
     */
    public BoundObject getBoundObjFromStr(final String textInput, final boolean movable, int imCount, final MediaTracker m,
    									  final Font font, final FontRenderContext frc, final Point defP) throws Exception
    {
    	final String[] tokens  = textInput.split("::");
    	String hotSpotLabel = "";

    	int maxAssociations = 0;

    	if(tokens.length < 2)
    		throw new Exception("Error: insufficient arguements, applet cannot perform properly");
    	Object label = tokens[1];

    	int[] coords = null;

//    	TODO debug, remove
    	for(int i=0; i < tokens.length; i++)
    		System.out.println("Token ["+i+"] is : -->"+tokens[i]+"<--");

    	if(tokens[1].contains(".png") || tokens[1].contains(".gif") || tokens[1].contains(".jpg"))
    	{
    		final Image img = getImage(getCodeBase(), (String)label);
			m.addImage(img, ++imCount);
			try
			{
				m.waitForAll();
			}
			/* Catch the exception */
			catch( final InterruptedException e )
			{
				System.out.println("Loading of the image was interrupted" );
			}
			label = img;
			coords = new int[4];
			coords[0] = coords[1] = 0;
			coords[2] = img.getWidth(this);
			coords[3] = img.getHeight(this);

    	}

    	String shape = "rect";
    	HashMap<String, Boolean> legitimateLinks = null;
    	if(tokens.length > 2)
    	{
	    	int check = 2;
	    	if(tokens[2].equals("circle") || tokens[2].equals("rect") || tokens[2].equals("ellipse") || tokens[2].equals("poly"))
	    	{
	    		shape = tokens[2];
	    		//split up the coordinates into the int array
	    		final String[] cordStrs = tokens[3].split(",");
	    		coords = new int[cordStrs.length];
	    		for(int i=0; i < cordStrs.length; i++)
	    			coords[i] = Integer.parseInt(cordStrs[i]);
	    		check = 4;
	    		if(tokens[2].equals("rect"))
	    		{
	    			coords[2] -= coords[0];
	    			coords[3] -= coords[1];
	    		}
	    	}

	    	if(check < tokens.length)
	    	{
		    	legitimateLinks = new HashMap<String,Boolean>();

		    	for(int i=check; i < tokens.length; i++)
		    	{
		    		if(tokens[i].contains("hotSpotLabel:"))
		    		{
		    			hotSpotLabel = tokens[i].substring(13);
		    		}else if(tokens[i].contains("maxAssociations:"))
		    		{
		    			System.out.println("sub string is : "+tokens[i].substring(16));
		    			maxAssociations = Integer.parseInt(tokens[i].substring(16));
		    		}else
		    			legitimateLinks.put(tokens[i], new Boolean(true));
		    	}
	    	}
    	}
    	if(legitimateLinks == null || legitimateLinks.keySet().size() == 0)
    		legitimateLinks = null;
    	else
    	{
    		final Iterator<String> keySet = legitimateLinks.keySet().iterator();
    		while(keySet.hasNext())
    			System.out.println(" there is an element called : "+keySet.next());
    	}
    	System.out.println("here with coords = "+coords);
    	if(coords == null)
    	{
    		final Rectangle2D bounds = (new TextLayout((String)label,font,frc)).getBounds();
    		coords = new int[4];
    		coords[2] =(int)bounds.getWidth();
    		coords[3] = (int)bounds.getHeight();
    		coords[0] = defP.x-(coords[2]/2);
    		coords[1] = defP.y-(coords[3]/2);
    	}
    	if(movable)
    	{
    		movObjCount.put(tokens[0], new Integer(0));
    		movObjMaxCount.put(tokens[0], new Integer(maxAssociations));
    		return new MovableObject(tokens[0],label,shape,coords,legitimateLinks,hotSpotLabel,maxAssociations);
    	}
    	else
    	{
    		return new BoundObject(tokens[0],label,shape,coords,legitimateLinks,hotSpotLabel,maxAssociations);
    	}
    }


    //format variables
    String om;

    //background
    Image backGround = null;
    //hotspots
    Vector<BoundObject> hotspots = null;
    //movable objects
    Vector<MovableObject> movableObjects = null;
    //configuration
    Color config_colour = null;
    int config_line_thickness = 1;
    String retType = "";
    String identifier = "";
    String feedback = "";

    //used for cloneable movable objects (non-single cardinality)
    HashMap<String, Integer> movObjCount;
    HashMap<String, Integer> movObjMaxCount;

    Graphics offG = null;
    //used for counting global user responses and maximum permitted responses
    int number_of_responses = -1;
    int user_responses = 0;

    //real time association creation variables
    BoundObject start = null;
    MovableObject mov = null;
    Point mpos = null;
    Vector<Association> associations = null;

    //render to buffer image
    Image offScreenImg;
    //graphics object for offscreen image
    Graphics offScreenG;
    //local hovered label reference
    BoundObject drawHSLabel = null;
}