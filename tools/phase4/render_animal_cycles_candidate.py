import bpy,sys,math,json
from mathutils import Vector
from pathlib import Path
file,out=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=file)
for o in list(bpy.data.objects):
 if o.type not in {'MESH','ARMATURE'}:bpy.data.objects.remove(o,do_unlink=True)
# Normalize only the supplied Pig material to a brighter readable pink; mesh and animation remain unchanged.
if Path(file).stem=='Pig' and bpy.data.materials.get('Material.003'):
 bpy.data.materials['Material.003'].diffuse_color=(0.92,0.57,0.60,1.0)
for m in bpy.data.materials:
 color=list(m.diffuse_color);m.use_nodes=True
 bsdf=next((n for n in m.node_tree.nodes if n.type=='BSDF_DIFFUSE'),None)
 if bsdf:bsdf.inputs['Color'].default_value=color
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=False;s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=1.5;s.view_settings.view_transform='Standard';s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.animation_data_create();arm.animation_data.action=bpy.data.actions['Idle'];s.frame_set(0);bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for o in bpy.data.objects if o.type=='MESH' for c in o.bound_box];mn=Vector([min(p[i] for p in pts) for i in range(3)]);mx=Vector([max(p[i] for p in pts) for i in range(3)]);center=(mn+mx)/2;ext=max(mx-mn)
cam=bpy.data.cameras.new('Camera');co=bpy.data.objects.new('Camera',cam);s.collection.objects.link(co);s.camera=co;cam.type='ORTHO';cam.ortho_scale=ext*1.5;co.location=center+Vector((-ext*3,0,ext*.45));co.rotation_euler=(center-co.location).to_track_quat('-Z','Y').to_euler()
for name,action,frame in [('idle','Idle',0)]:
 arm.animation_data.action=bpy.data.actions[action];s.frame_set(frame);s.render.filepath=str(Path(out)/(name+'.png'));bpy.ops.render.render(write_still=True)
print('ANIMAL_METADATA',json.dumps({'file':file,'bounds':[list(mn),list(mx)],'actions':[(a.name,list(a.frame_range)) for a in bpy.data.actions]}))
