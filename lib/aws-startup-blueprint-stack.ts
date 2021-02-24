import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import { ConfigConformancePacks } from './aws-config-packs'
import { ClientVpn } from './aws-vpn'
import { BlueprintVpcs } from './aws-vpcs'
import { Dns } from './aws-dns'
import { BlueprintServiceCatalog } from './aws-service-catalog'
import { PermissionBoundary } from './aws-iam'


export class AwsStartupBlueprintStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const blueprintVPCs = new BlueprintVpcs(this, 'VpcCore', {});

    new ClientVpn(this, 'ClientVpn',{
      HomeVpc: blueprintVPCs.ManagmentVPC,      
      vpnClientAssignedAddrCidr: "10.71.0.0/16",
      DnsServer: blueprintVPCs.MangementVpcDnsIp,
      ProductionVpc: blueprintVPCs.ProductionVpc,
      ManagmentVPC: blueprintVPCs.ManagmentVPC,
      DevelopmentVpc: blueprintVPCs.DevelopmentVpc
    });

    new ConfigConformancePacks(this, 'ConfigPacks', {});

    new Dns(this,'Dns', {
      ManagmentVPC: blueprintVPCs.ManagmentVPC,
      ProductionVpc: blueprintVPCs.ProductionVpc,
      DevelopmentVpc: blueprintVPCs.DevelopmentVpc,      
      TopLevelDomain: "corp"      
    });

    new BlueprintServiceCatalog(this, 'ServiceCatalog', {});

    const newManagedPolicy = new iam.ManagedPolicy(AwsStartupBlueprintStack, 'DiGavPermissionBoundaryPolicy', {
      document: customPolicyDocument
      });

  }

}
