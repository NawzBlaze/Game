import bpy,sys,math,json
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];file,out=args
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.wm.obj_import(filepath=file)

# The creator's vertex channels drive engine-specific wear/AO shaders; use the original texture directly in the offline neutral-material pass.
for mat in bpy.data.materials:
 if not mat.use_nodes: continue
 nodes=mat.node_tree.nodes; bsdf=next((n for n in nodes if n.type=='BSDF_PRINCIPLED'),None); tex=next((n for n in nodes if n.type=='TEX_IMAGE' and n.image and not 'normal' in n.image.name.lower()),None)
 if bsdf and tex:
  mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
  if 'Alpha' in tex.outputs: mat.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.world=bpy.data.worlds.new('Studio World');scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0.8;scene.view_settings.view_transform='Standard';scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100
bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in bpy.data.objects if o.type=='MESH' for c in o.bound_box]; mn=Vector([min(p[i] for p in pts) for i in range(3)]);mx=Vector([max(p[i] for p in pts) for i in range(3)]);center=(mn+mx)/2;ext=max(mx-mn)
cam=bpy.data.cameras.new('Camera');co=bpy.data.objects.new('Camera',cam);scene.collection.objects.link(co);scene.camera=co;cam.type='ORTHO';cam.ortho_scale=ext*1.7;co.location=center+Vector((ext*1.4,-ext*3,ext*.75));co.rotation_euler=(center-co.location).to_track_quat('-Z','Y').to_euler();ld=bpy.data.lights.new('Studio','AREA');lo=bpy.data.objects.new('Studio',ld);scene.collection.objects.link(lo);lo.location=center+Vector((ext*1.5,-ext*2,ext*3));ld.energy=ext*ext*100;ld.shape='DISK';ld.size=ext*3;lo.rotation_euler=(center-lo.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=out;bpy.ops.render.render(write_still=True);print('MODEL_BOUNDS',file,list(mn),list(mx))
