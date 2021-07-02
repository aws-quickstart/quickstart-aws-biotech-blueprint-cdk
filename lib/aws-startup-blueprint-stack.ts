import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import { ConfigRecorderEnabledPromise, ConfigConformancePackBundle } from './aws-config-packs'
import { ClientVpn } from './aws-vpn'
import { BlueprintVpcs } from './aws-vpcs'
import { Dns } from './aws-dns'
import { BlueprintServiceCatalog } from './aws-service-catalog'
import { RegionRestriction } from './aws-region-restriction'


export class AwsStartupBlueprintStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Core VPCs

    const blueprintVPCs = new BlueprintVpcs(this, 'VpcCore', {});

    // Client VPN Capability

    new ClientVpn(this, 'ClientVpn',{
      HomeVpc: blueprintVPCs.ManagmentVPC,      
      vpnClientAssignedAddrCidr: "10.71.0.0/16",
      DnsServer: blueprintVPCs.MangementVpcDnsIp,
      ProductionVpc: blueprintVPCs.ProductionVpc,
      ManagmentVPC: blueprintVPCs.ManagmentVPC,
      DevelopmentVpc: blueprintVPCs.DevelopmentVpc
    });

    // Config Conformance Packs

    const ConfigEnabled = new ConfigRecorderEnabledPromise(this, 'ConfigEnabledPromise',{
      skipCreatingRecorderAndDeliveryChannel: false
      //existingRecorderDeliveryBucket: "" 
    });
    new ConfigConformancePackBundle(this, 'ConfigPacks', {
      ConfigRecorderEnabledPromise: ConfigEnabled,
      PackConfigs: [
        {ConformancePackName: "Operational-Best-Practices-For-AWS-Identity-And-Access-Management", TemplatePath: "config-packs/configpack.iam.bestpractices.yaml" },
        {ConformancePackName: "Operational-Best-Practices-For-Amazon-S3", TemplatePath: "config-packs/configpack.s3.bestpractices.yaml" },
        {ConformancePackName: "Operational-Best-Practices-for-NIST-CSF", TemplatePath: "config-packs/configpack.nist.csf.bestpractices.yaml" },
        {ConformancePackName: "AWS-Control-Tower-Detective-Guardrails-Conformance-Pack", TemplatePath: "config-packs/configpack.ct.detectiveguardrails.yaml" },
        {ConformancePackName: "Operational-Best-Practices-for-HIPAA-Security", TemplatePath: "config-packs/configpack.hipaa.bestpractices.yaml" },
      ]
    });
    
    // Shared DNS

    new Dns(this,'Dns', {
      ManagmentVPC: blueprintVPCs.ManagmentVPC,
      ProductionVpc: blueprintVPCs.ProductionVpc,
      DevelopmentVpc: blueprintVPCs.DevelopmentVpc,      
      TopLevelDomain: "corp"      
    });
    
    // Region Restriction 

    const apply_EU_RegionRestriction = this.node.tryGetContext('apply_EU_RegionRestriction');
    const apply_US_RegionRestriction = this.node.tryGetContext('apply_US_RegionRestriction');
    
    if(apply_EU_RegionRestriction == "true") {
      new RegionRestriction(this, 'RegionRestriction', {
        AllowedRegions: ["eu-central-1","eu-west-1","eu-west-3", "eu-south-1", "eu-north-1"]
      });  
    } 
    else if (apply_US_RegionRestriction == "true"){
      new RegionRestriction(this, 'RegionRestriction', {
        AllowedRegions: ["us-east-1","us-east-2","us-west-1", "us-west-2"]
      }); 
      
    }
    
    // ServiceCatalog
    
    const blueprintServiceCatalog = new BlueprintServiceCatalog(this, 'BlueprintServiceCatalog', {});
    
    
  }

}
