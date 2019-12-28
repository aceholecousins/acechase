


fin = open("model_raw.dae","r")
xml = fin.read()
fin.close()

xml = xml.replace('''<texture texture="gridtex_png-sampler" texcoord="UVMap"/>''',
'''<texture texture="gridtex_png-sampler" texcoord="UVMap">
<extra>
<technique>
<mirrorU>0</mirrorU>
<mirrorV>0</mirrorV>
<wrapU>1</wrapU>
<wrapV>1</wrapV>
<repeatU>128</repeatU>
<repeatV>128</repeatV>
<offsetU>0</offsetU>
<offsetV>0</offsetV>
</technique>
</extra>
</texture>''')

xml = xml.replace('''<emission>''',
'''<emission>
<color sid="emission">1 1 1 1</color>''')

xml = xml.replace("png", "svg")

xml = xml.replace("<up_axis>Z_UP</up_axis>", "<up_axis>Y_UP</up_axis>")

fout = open("model.dae","w")
fout.write(xml)
fout.close()
