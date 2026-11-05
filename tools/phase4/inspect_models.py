import bpy,sys,math,json
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]; file,out=args
bpy.ops.wm.open_mainfile(filepath=file)
for obj in list(bpy.data.objects):
 if obj.type not in {'MESH','ARMATURE'}: bpy.data.objects.remove(obj,do_unlink=True)
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH';scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.resolution_x=320;scene.render.resolution_y=320;scene.render.resolution_percentage=100
arm=next((x for x in bpy.data.objects if x.type=='ARMATURE'),None)
if arm and bpy.data.actions.get('Idle'):
 arm.animation_data_create();arm.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(10)
bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in bpy.data.objects if o.type=='MESH' for c in o.bound_box];minv=Vector([min(p[i] for p in pts) for i in range(3)]);maxv=Vector([max(p[i] for p in pts) for i in range(3)]);center=(minv+maxv)/2;ext=max(maxv-minv)
cam=bpy.data.cameras.new('Camera');co=bpy.data.objects.new('Camera',cam);scene.collection.objects.link(co);scene.camera=co;cam.type='ORTHO';cam.ortho_scale=ext*1.5
print('LPC_META',json.dumps({'bounds':[list(minv),list(maxv)],'size':list(maxv-minv),'actions':[(x.name,list(x.frame_range)) for x in bpy.data.actions],'materials':[(m.name,list(m.diffuse_color)) for m in bpy.data.materials]}))
for angle in [0,90,180,270]:
 rad=math.radians(angle);co.location=center+Vector((math.sin(rad)*ext*3,math.cos(rad)*ext*3,ext*.65));co.rotation_euler=(center-co.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(Path(out)/('angle-'+str(angle)+'.png'));bpy.ops.render.render(write_still=True)
