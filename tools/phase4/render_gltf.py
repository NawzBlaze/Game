import bpy,sys,math,json
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];file,out=args
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=file)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=False;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100
bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in bpy.data.objects if o.type=='MESH' for c in o.bound_box]; mn=Vector([min(p[i] for p in pts) for i in range(3)]);mx=Vector([max(p[i] for p in pts) for i in range(3)]);center=(mn+mx)/2;ext=max(mx-mn)
cam=bpy.data.cameras.new('Camera');co=bpy.data.objects.new('Camera',cam);scene.collection.objects.link(co);scene.camera=co;cam.type='ORTHO';cam.ortho_scale=ext*1.16;co.location=center+Vector((ext*1.4,-ext*3,ext*.75));co.rotation_euler=(center-co.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=out;bpy.ops.render.render(write_still=True);print('MODEL_BOUNDS',file,list(mn),list(mx))
