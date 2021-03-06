courserunner
============

Quick and Dirty prototype of a browser-based agility course editor with 3D capabilities

The backend is just an incredibly dumb datastore of the json generated by the web app using MySQL for persistence. The only potentially useful things are in the javascript side, converting a 2D agility course into a 3D representation. 

You can design a dog agility course in a traditional 2d view and can share your design with others just by sharing the generated URL.

![2d view](https://github.com/FranGM/courserunner/blob/master/screenshots/2dview.png)

You can switch back and forth between 2d and 3d view and see how the designed circuit would look like in a 3d view.

![3d view](https://github.com/FranGM/courserunner/blob/master/screenshots/3dview.png)

By pressing `c` during the 3d view, you can switch to a first person view, and literally walk the course with a 3d character in the same way you'd walk the course in real life.

![first person view](https://github.com/FranGM/courserunner/blob/master/screenshots/firstperson.png)

Everything was hacked together fairly hastily as an experiment but it might be useful as a starting point for a potential future rewrite.

