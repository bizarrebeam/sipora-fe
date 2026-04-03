import glob
import os

files = glob.glob('c:/Users/adel/Downloads/code/coolyeah/propensi/sipora-fe/src/views/*.vue')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<SDatePicker v-model=' in content:
        new_content = content.replace('<SDatePicker v-model=', '<SDatePicker @close="showDatePicker = false" v-model=')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
