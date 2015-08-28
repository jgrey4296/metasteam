define([],function(){
  /**
   * A Graph implementation as an adjacency list
   */

  //Graph Object
  var Graph = function(){
    this.allNodes = [];
  };

  Graph.prototype.newNode = function(name){
    var newNode = new Node(name);
    this.addNode(newNode);
    return newNode;
  };

    Graph.prototype.addNode = function(node){
      this.allNodes.push(node);
    };

    Graph.prototype.getNode = function(name){
      for(var i in this.allNodes){
        var node = this.allNodes[i];
        if(node.name === name){
          return node;
        }
      }
      return undefined;
    };

  Graph.prototype.toString = function(){
    var graphString = "Graph: ";
    for(var i in this.allNodes){
      var node = this.allNodes[i];
      graphString += "\nChild: " + node.name;
    }
    return graphString;
  };

  //Node Object
  var Node = function(name){
    this.name = name;
    this.children = [];
    this.parents = [];
  };

  Node.prototype.addChild = function(node){
    this.children.push(node);
    node.parents.push(this);
  };

  Node.prototype.addParent = function(node){
    this.parents.push(node);
    node.children.push(this);
  };

  Node.prototype.toString = function(){
    var nodeString = "Node: \n";
    nodeString += "Name: " + this.name + "\n";
    nodeString += "Parents: \n";
    for(var i in this.parents){
      var parentNode = this.parents[i];
      nodeString += "    " + parentNode.name + "\n";
    }
    nodeString += "Children: \n";
    for(var i in this.children){
      var childNode = this.children[i];
      nodeString += "    " + childNode.name + "\n";
    }
    return nodeString;
  };


  //Main Interface
  var interface = {
      "newGraph" : function(){
        return new Graph();
      },
      "newNode" : function(graph,name){
        var newNode = new Node(name);
        graph.addNode(newNode);
        return newNode;
      }
  };

  return interface;
});