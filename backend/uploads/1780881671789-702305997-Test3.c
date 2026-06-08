#include <stdio.h>

int min, max;

void minmax(int arr[], int l, int h);

void main()
{
 int n;
 printf("Enter no. of elements in the set: ");
 scanf("%d", &n);

 int arr[n];
 printf("Enter the set: ");
 for(int i=0; i<n; i++)
 {scanf("%d", &arr[i]);}

 minmax(arr, 0, n-1);

 printf("Minimum and maximum values are %d & %d respectively.", min, max);
}



void minmax(int arr[], int l, int h)
{
 if(l==h)
 {min=max=arr[l];}
 else
 {
  if(l==h-1)
  {
   if(arr[l]>arr[h])
   {min = arr[h]; max = arr[l];}
   else
   {min = arr[l]; max = arr[h];}
  }
  else
  {
   int tmin, tmax, mid=(h+l)/2;
   minmax(arr, l, mid);
   tmin=min; tmax=max;
   minmax(arr, mid+1, h);

   if(tmin<min)
   {min = tmin;}

   if(tmax>max)
   {max=tmax;}
  }
 }
}