/*
 *  Copyright (C) <2013>  <Mateusz Sławomir Lach>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 *  http://www.gnu.org/copyleft/lesser.html
 */

var QuadTree = function(x, y, width, height, level)
{
    this.width = width;
    this.height= height;
    this.x     = x;
    this.y     = y;
    this.level = level;
    
    this.sprites = new Array();
    this.nodes   = null;
    this.colors  = ['black', 'white', 'red', 'yellow', 'green'];
    
    var MAX_SPRITES_NUM = 4;
    var MAX_LEVELS_NUM  = 4; 
    
    this.draw = function(ctx)
    {
        if(this.nodes !== null)
        {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y+(this.height/2));
            ctx.lineTo(this.x+this.width, this.y+(this.height/2));
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x+(this.width/2), this.y);
            ctx.lineTo(this.x+(this.width/2), this.y+this.height);
            ctx.stroke();
            
            
        }
        oldStrokeStyle = ctx.strokeStyle;
        ctx.strokeStyle = 'white';
        ctx.strokeText(this.sprites.length, this.x+(this.width/2), this.y+(this.height/2) );
        ctx.strokeStyle = oldStrokeStyle;
        if(this.sprites !== null)
        {
            for(sprite in this.sprites)
            {
                ctx.beginPath();
                oldStrokeStyle = ctx.strokeStyle;
                ctx.strokeStyle = this.colors[this.level-1];
                ctx.rect(this.sprites[sprite].x, this.sprites[sprite].y, this.sprites[sprite].width, this.sprites[sprite].height);
                ctx.stroke();                    
                ctx.closePath();
                ctx.strokeStyle = oldStrokeStyle;
            }
        }
        
        if(this.nodes !== null)
        {
            this.nodes.topLeft.draw(ctx);
            this.nodes.topRight.draw(ctx);
            this.nodes.bottomLeft.draw(ctx);
            this.nodes.bottomRight.draw(ctx);
        }
    }
    
    this.add = function(elem, x, y, width, height)
    {
        var quarter = this.getQuarter(x, y, width, height);
        if(this.nodes !== null && quarter !== false)
        {
            this.nodes[quarter].add(elem, x, y, width, height);
        } 
        else if(this.sprites.length >= MAX_SPRITES_NUM && this.level < MAX_LEVELS_NUM)
        {
            this.sprites[this.sprites.length] = {'elem':elem, 'x':x, 'y':y, 'width':width, 'height':height};
            this.split();
            
            for(var i=0; i<this.sprites.length;)
            {
                var sprite  = this.sprites[i];
                quarter = this.getQuarter(sprite.x, sprite.y, sprite.width, sprite.height);
                
                if(quarter !== false) //if belongs to some of child quarter
                {
                    this.nodes[quarter].add(sprite.elem, sprite.x, sprite.y, sprite.width, sprite.height);
                    this.sprites.splice(i, 1);
                }
                else //if does not belong to any of child quarter
                {
                    i++;
                }
            }
        }
        else
        {
            this.sprites[this.sprites.length] = {'elem':elem, 'x':x, 'y':y, 'width':width, 'height':height};
        }
    };
    
    this.clone = function()
    {
        var cloned = new QuadTree;
        for(prop in this)
        {
            cloned[prop] = this[prop];
        }
        return cloned;
    };
    
    this.clear = function()
    {
        for(var i=0; i<this.sprites.length; i++)
        {
            this.sprites[i] = null;
        }
        this.sprites = new Array();
        
        if(this.nodes !== null)
        {
            this.nodes.topLeft.clear();
            this.nodes.topRight.clear();
            this.nodes.bottomLeft.clear();
            this.nodes.bottomRight.clear();
            this.nodes = null;
        }
    }
    
    this.split = function()
    {
        if(this.nodes === null)
        {
            this.nodes = {topLeft: null, topRight: null, bottomLeft: null, bottomRight: null};
            
            var width  = parseInt(this.width/2);
            var height = parseInt(this.height/2);

            this.nodes.topLeft    = new QuadTree(this.x, this.y, width, height, this.level+1);
            this.nodes.topRight   = new QuadTree(this.x+width, this.y, width, height, this.level+1);
            this.nodes.bottomLeft = new QuadTree(this.x, this.y+height, width, height, this.level+1);
            this.nodes.bottomRight= new QuadTree(this.x+width, this.y+height, width, height, this.level+1);
        }
    };
    
    this.count = function()
    {
        var result = this.sprites.length;
        
        if(this.nodes !== null)
        {
            result += (this.nodes.topLeft.count() + this.nodes.topRight.count()
                        + this.nodes.bottomRight.count() + this.nodes.bottomLeft.count());
        }
        return result;
    };
    
    this.getElemsNearby = function(x, y, width, height)
    {
        var result = new Array();
        for(var i=0; i<this.sprites.length; i++)
        {
            result[result.length] = this.sprites[i].elem;
        }
        
        var quarter = this.getQuarter(x, y, width, height);
        if(quarter !== false)
        {
            var subResult = this.nodes[quarter].getElemsNearby(x, y, width, height);
            for(var j=0; j<subResult.length; j++)
            {
                result[result.length] = subResult[j];
            }
        }
        return result;
    };
    
    this.getQuarter = function(x, y, width, height)
    {
        var result = null;
        
        if(this.nodes === null)
        {
            result = false;
        }
        else
        {
            var horizontalBorder  = this.y + parseInt(this.height/2);
            var verticalBorder    = this.x + parseInt(this.width/2);
            
            var isInTop    = (y <= horizontalBorder) && (y + height <= horizontalBorder);
            var isInBottom = y > horizontalBorder;
            
            var isInLeft   = (x <= verticalBorder) && (x + width <= verticalBorder);
            var isInRight  = (x > verticalBorder);
            
            if(isInTop)
            {
                if(isInLeft)
                {
                    result = "topLeft";
                }
                else if(isInRight)
                {
                    result = "topRight";
                }
                else
                {
                    result = false;
                }
            }
            else if(isInBottom)
            {
                if(isInLeft)
                {
                    result = "bottomLeft";
                }
                else if(isInRight)
                {
                    result = "bottomRight";
                }
                else
                {
                    result = false;
                }
            }
            else
            {
                result = false;
            }
        }
        return result;
    };
}
