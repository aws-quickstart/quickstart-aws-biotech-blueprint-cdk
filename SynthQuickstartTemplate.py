import os
import yaml 

folders = []
files = []
for entry in os.scandir('./lambda_functions/source/'):
    if entry.is_dir():

        if "asset." not in entry.path:
            print("WARN: Skipping path...")
        else:
            folders.append(entry.path)

templateStream = open('./templates/AwsBiotechBlueprint.template.yml', 'r')
templateData = yaml.load(templateStream)

taskcatConfigStream = open('./.taskcat.yml', 'r')
taskcatConfig = yaml.load(taskcatConfigStream)


for assetFolder in folders:
    
    assetFolderComponents = assetFolder.split('asset.')
    
    assetId = assetFolderComponents[1]
    

    for parameter in templateData['Parameters']:
        if assetId in parameter:
            if 'S3Bucket' in parameter:
                templateData['Parameters'][parameter]['Default'] = "aws-quickstart"
                taskcatConfig['tests']['default']['parameters'][parameter] = '$[taskcat_autobucket]'
                
                templateData['Conditions'][f'UsingDefaultQuickstartBucket{assetId}'] = {
                    "Fn::Equals" : [{"Ref" : parameter}, "aws-quickstart"]
                }
                
            if 'VersionKey' in parameter:
                templateData['Parameters'][parameter]['Default'] = f"quickstart-aws-biotech-blueprint-cdk/lambda_functions/packages/asset{assetId}/||lambda.zip"
                taskcatConfig['tests']['default']['parameters'][parameter] = f"quickstart-aws-biotech-blueprint-cdk/lambda_functions/packages/asset{assetId}/||lambda.zip"
            if 'ArtifactHash' in parameter:
                templateData['Parameters'][parameter]['Default'] = assetId
                taskcatConfig['tests']['default']['parameters'][parameter] = assetId
            
    
    for resource in templateData['Resources']:
        resourceType = templateData['Resources'][resource]['Type']
        if resourceType == 'AWS::Lambda::Function':
            
            
            if "S3Bucket" in templateData['Resources'][resource]['Properties']['Code']:
                if assetId in templateData['Resources'][resource]['Properties']['Code']['S3Bucket']['Ref']:
                    
                    bucketParamName = templateData['Resources'][resource]['Properties']['Code']['S3Bucket']['Ref']
                    
                    templateData['Resources'][resource]['Properties']['Code']['S3Bucket'] = {
                        "Fn::If": [f'UsingDefaultQuickstartBucket{assetId}', { "Fn::Join" : ['-', [ {"Ref": bucketParamName} , {"Ref": 'AWS::Region'} ] ] } , {"Ref": bucketParamName}]
                        
                    }
                    

   
    
    os.replace(assetFolder, f"./lambda_functions/source/asset{assetId}")

    
with open('./templates/AwsBiotechBlueprint.template.quickstart.yml', 'w') as yaml_file:
    yaml_file.write( yaml.dump(templateData, default_flow_style=False))
    

with open('./.taskcat.yml', 'w') as yaml_file:
    yaml_file.write( yaml.dump(taskcatConfig, default_flow_style=False))