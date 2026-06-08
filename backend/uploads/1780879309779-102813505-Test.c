#include <stdio.h>
#include <time.h>

void main()
{
 int n;
 long long sum=0;
 double start, end;

 printf("Enter an integer: ");
 scanf("%d", &n);

 start = clock();

 for(int i=1; i<=n; i++)
 {sum += i;}

 end = clock();

 printf("The factorial is %lld\n", sum);
 printf("Total time elapsed: %lf", end-start);
}